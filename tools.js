import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export async function createDirectory(dirPath) {
    try {
        fs.mkdirSync(dirPath, { recursive: true });
        return `Directory ${dirPath} created successfully.`;
    } catch (err) {
        return `Error creating directory: ${err.message}`;
    }
}

export async function createFile(filePath, content) {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, content, 'utf8');
        return `File ${filePath} created successfully.`;
    } catch (err) {
        return `Error creating file: ${err.message}`;
    }
}

export async function executeCommand(cmd) {
   return new Promise((resolve) => {
       exec(cmd, (error, stdout, stderr) => {
           if(error){
               resolve(`Error: ${error.message}`);
           } else {
               resolve(`Command executed. Output: ${stdout}\nStderr: ${stderr}`);
           }
       })
   })
}

export const toolsMap = {
    createDirectory,
    createFile,
    executeCommand
};
