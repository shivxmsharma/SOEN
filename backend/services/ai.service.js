// import { GoogleGenAI } from "@google/genai";

// const ai = new GoogleGenAI({
//     key: process.env.GOOGLE_AI_KEY
// });

// async function main() {
//     const response = await ai.models.generateContent({
//         model: "gemini-2.5-flash",
//         contents: "Explain how AI works in a few words",
//     });
//     console.log(response.text);
// }

// await main();

// import { GoogleGenAI } from "@google/genai";

// const ai = new GoogleGenAI({});


// export const generateResult = async (prompt) => {
    
//     const result = await ai.models.generateContent({
//         model: "gemini-2.5-flash",
//         contents: [
//             {
//                 role: "user",
//                 parts: [{ text: "You are an expert in MERN and Development. you have an experience of 10 years in the development. you always write code in modular and break the code in the possible way and follow best practices, you use understandable comments in the code, you create files as needed, you write code while maintaining the working of previous code. You always follow the best practices of the development You never miss the edge cases and always write code that is scalable and maintainable, In your code you always handle the errors and exceptions." }]
//           },
            
//           {
//             role: "user",
//             parts: [
//               {
//                 text: "Hello",
//               },
//             ],
//           },

//           {
//             role: "model",
//             parts: [
//               {
//                 text: "Hello, How can I assist you today?",
//               },
//             ],
//           },

//             {
//                 role: "user",
//                 parts: [
//                     {
//                         text: "Create an Express server.",
//                     },
//                 ],
//             },
//             {
//                 role: "model",
//                 parts: [
//                     {
//                         text: `// app.js
//       import express from 'express';
//       const app = express();
      
//       app.get('/', (req, res) => {
//         res.send('Hello World!');
//       });
      
//       app.listen(3000, () => {
//         console.log('Server is running on port 3000');
//       });
      
//       // package.json
//       {
//         "name": "express-server",
//         "version": "1.0.0",
//         "main": "app.js",
//         "type": "module",
//         "scripts": {
//           "start": "node app.js"
//         },
//         "dependencies": {
//           "express": "^4.17.1"
//         }
//       }`,
//                     "buildCommand": {
//                       mainItem: "npm",
//                       commands: ["install"]
//                     },
                    
//                     "startCommand": {
//                       mainItem: "node",
//                       commands: ["app.js"]
//                     }
//                   },
//               ],
//           },
          
         

         
//             {
//                 role: "user",
//                 parts: [{ text: prompt }],
//             }
//         ],
//     });

//     console.log(result);

    
//     return result?.candidates?.[0]?.content || "No content returned";
// };

import { GoogleGenAI } from "@google/genai";

// Use the default auth (assumes GOOGLE_API_KEY is set in .env)
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_KEY,
});

export const generateResult = async (prompt) => {
  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
You are an expert in MERN and Development. You have 10 years of experience in writing scalable and maintainable production code.

Guidelines:
- Write modular code
- Include clear comments
- Maintain previous working code
- Always handle edge cases and exceptions
-IMPORTANT: Don't use files that name like routes/index.js
- Suggest realistic file structures
- Return your output as JSON format including:

{
  "text": "your explanation",
  "fileTree": {
    "filename": {
      "file": {
        "contents": "..."
      }
    }
  },
  "buildCommand": {
    "mainItem": "npm",
    "commands": ["install"]
  },
  "startCommand": {
    "mainItem": "node",
    "commands": ["app.js"]
  }
}

Examples:

<example>
user: Hello
response: {
  "text": "Hello, how can I help you today?"
}
</example>

<example>
user: Create an Express server
response: {
  "text": "Here's your express server setup",
  "fileTree": {
    "app.js": {
      "file": {
        "contents": "const express = require('express');\\nconst app = express();\\napp.get('/', (req, res) => res.send('Hello World!'));\\napp.listen(3000, () => console.log('Server is running'));"
      }
    },
    "package.json": {
      "file": {
        "contents": "{\\n  \\"name\\": \\"express-server\\",\\n  \\"version\\": \\"1.0.0\\",\\n  \\"main\\": \\"app.js\\",\\n  \\"scripts\\": { \\"start\\": \\"node app.js\\" },\\n  \\"dependencies\\": { \\"express\\": \\"^4.17.1\\" }\\n}"
      }
    }
  },
  "buildCommand": {
    "mainItem": "npm",
    "commands": ["install"]
  },
  "startCommand": {
    "mainItem": "node",
    "commands": ["app.js"]
  }
}
</example>
`,
          },
        ],
      },
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  const content = result?.candidates?.[0]?.content;
  if (!content) return "No content returned";

  try {
    const jsonText = content.parts?.[0]?.text?.trim();
    return JSON.parse(jsonText);
  } catch {
    return { text: content.parts?.[0]?.text || "Could not parse structured response" };
  }
};

// Streaming version
export const generateContentStream = async (prompt) => {
    return ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.4,
        },
        contents: [
            {
                role: "user",
                parts: [{ text: `
You are an expert in MERN and Development. You have 10 years of experience in writing scalable and maintainable production code.
Always return your output in JSON format as specified in the previous examples.
` }]
            },
            {
                role: "user",
                parts: [{ text: prompt }]
            }
        ]
    });
};

