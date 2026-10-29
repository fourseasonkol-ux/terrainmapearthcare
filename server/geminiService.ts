import { FunctionDeclaration, GoogleGenAI, Type } from '@google/genai';

/**
 * Server-side Gemini AI integration for natural language GIS commands
 * Uses @google/genai with gemini-3.8-flash
 */

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

const gisToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'setContourInterval',
    description: 'Updates the contour interval spacing and index multiple for the terrain map.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        intervalMeters: {
          type: Type.NUMBER,
          description: 'The contour interval in meters (e.g. 10, 20, 50, 100, 250).'
        },
        indexMultiple: {
          type: Type.NUMBER,
          description: 'Index contour multiplier (e.g. 5 means every 5th contour line is emphasized).'
        }
      },
      required: ['intervalMeters']
    }
  },
  {
    name: 'toggleLayer',
    description: 'Turns specific GIS map layers on or off.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        layer: {
          type: Type.STRING,
          description: 'Layer to toggle: elevationRelief, contours, slope, hillshade, aspect, userDrawings'
        },
        enabled: {
          type: Type.BOOLEAN,
          description: 'True to enable/show the layer, false to hide it'
        }
      },
      required: ['layer', 'enabled']
    }
  },
  {
    name: 'configureHillshade',
    description: 'Adjusts illumination angles and vertical exaggeration for terrain hillshade visualization.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        azimuth: {
          type: Type.NUMBER,
          description: 'Sun azimuth in degrees (0 to 360, where 315 is standard NW illumination)'
        },
        altitude: {
          type: Type.NUMBER,
          description: 'Sun altitude/solar elevation angle in degrees (0 to 90, e.g. 45)'
        },
        verticalExaggeration: {
          type: Type.NUMBER,
          description: 'Vertical exaggeration multiplier (e.g. 1.0 to 5.0)'
        }
      }
    }
  },
  {
    name: 'configureSlope',
    description: 'Sets slope measurement units (degrees or percent grade) and color ramp scheme.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        unit: {
          type: Type.STRING,
          description: 'Slope unit: "degrees" or "percent"'
        },
        colorRamp: {
          type: Type.STRING,
          description: 'Color ramp: "inferno", "viridis", "spectral", or "hazard"'
        }
      }
    }
  },
  {
    name: 'setElevationUnits',
    description: 'Changes elevation measurement display unit to meters or feet.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        unit: {
          type: Type.STRING,
          description: 'Elevation unit: "meters" or "feet"'
        }
      },
      required: ['unit']
    }
  },
  {
    name: 'searchLocation',
    description: 'Navigates the map to a specific geographic place, mountain, park, or coordinate.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'Place name, mountain peak, or coordinate string (e.g. "Mount Rainier", "Grand Canyon", "Matterhorn")'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'runTerrainAnalysis',
    description: 'Triggers raster terrain analysis (contours, slope, hillshade, statistics) on the current area of interest.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        contourInterval: {
          type: Type.NUMBER,
          description: 'Optional desired contour interval in meters'
        }
      }
    }
  }
];

export interface GeminiAssistantResponse {
  reply: string;
  actions: {
    name: string;
    args: any;
  }[];
}

export async function processGeminiGISPrompt(
  prompt: string,
  currentState: {
    center: [number, number];
    zoom: number;
    activeBasemap: string;
    layers: Record<string, boolean>;
    elevationUnit: string;
    contourInterval: number;
    terrainStats?: any;
    aoi?: any;
  }
): Promise<GeminiAssistantResponse> {
  const ai = getAIClient();

  const systemInstruction = `
You are the AI Assistant inside TerrainMap AI, a professional GIS web application.
Your role is to:
1. Translate user natural-language commands into structured tool actions (e.g., setting contour interval, toggling layers, adjusting hillshade, searching coordinates or locations, changing units, or triggering terrain analysis).
2. Provide concise, professional, geospatially accurate explanations of terrain, elevation, slope, and geomorphology.
3. NEVER invent elevation measurements, fake coordinates, or claim an analysis has completed before the actual processing engine executes. Always distinguish between verified dataset facts and general explanations.

Current map context:
- Center coordinates: [lng: ${currentState.center[0]}, lat: ${currentState.center[1]}]
- Zoom level: ${currentState.zoom}
- Elevation unit: ${currentState.elevationUnit}
- Contour interval: ${currentState.contourInterval}m
- Active layers: ${JSON.stringify(currentState.layers)}
- Terrain statistics available: ${currentState.terrainStats ? JSON.stringify(currentState.terrainStats) : 'None computed yet'}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      systemInstruction,
      tools: [{ functionDeclarations: gisToolDeclarations }]
    }
  });

  const actions: { name: string; args: any }[] = [];
  if (response.functionCalls && response.functionCalls.length > 0) {
    for (const fc of response.functionCalls) {
      actions.push({
        name: fc.name || 'gisAction',
        args: fc.args || {}
      });
    }
  }

  const replyText = response.text ?? (actions.length > 0 ? 'Executing your requested GIS action.' : 'How can I assist with your terrain map?');

  return {
    reply: replyText || 'Action executed.',
    actions
  };
}
