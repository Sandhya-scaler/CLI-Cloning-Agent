import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

/**
 * Creates a directory (and any missing parent directories).
 * @param {string} dirPath - Relative or absolute path to create.
 */
export async function createDirectory(dirPath) {
    try {
        fs.mkdirSync(dirPath, { recursive: true });
        return `Directory "${dirPath}" created successfully.`;
    } catch (err) {
        return `Error creating directory: ${err.message}`;
    }
}

/**
 * Creates a file with the given content.
 * Automatically creates parent directories if they don't exist.
 * @param {string} filePath - Relative path of the file to create.
 * @param {string} content  - Full text content to write.
 */
export async function createFile(filePath, content) {
    try {
        if (!filePath) return 'Error: filePath is required.';
        if (content === undefined || content === null) content = '';

        const dir = path.dirname(filePath);
        if (dir && dir !== '.') {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, content, 'utf8');
        return `File "${filePath}" created successfully (${content.length} bytes).`;
    } catch (err) {
        return `Error creating file: ${err.message}`;
    }
}

/**
 * Executes a shell command and returns its stdout/stderr output.
 * Times out after 30 seconds to prevent hanging.
 * @param {string} cmd - The shell command to run.
 */
export async function executeCommand(cmd) {
    if (!cmd || !cmd.trim()) return 'Error: No command provided.';

    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            resolve('Command timed out after 30 seconds.');
        }, 30000);

        exec(cmd, { shell: true }, (error, stdout, stderr) => {
            clearTimeout(timeout);
            if (error) {
                resolve(`Error: ${error.message}${stderr ? '\nStderr: ' + stderr : ''}`);
            } else {
                const out = stdout ? stdout.trim() : '';
                const err = stderr ? stderr.trim() : '';
                resolve(`Command executed successfully.${out ? '\nOutput: ' + out : ''}${err ? '\nStderr: ' + err : ''}`);
            }
        });
    });
}

export const toolsMap = {
    createDirectory,
    createFile,
    executeCommand,
};
