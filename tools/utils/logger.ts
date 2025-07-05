import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export class Logger {
  private logDir: string;
  private scriptName: string;

  constructor(scriptName: string) {
    this.scriptName = scriptName;
    this.logDir = join(process.cwd(), 'logs');
    
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFilePath(): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return join(this.logDir, `${this.scriptName}_${timestamp}.log`);
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? `\nData: ${JSON.stringify(data, null, 2)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}\n`;
  }

  info(message: string, data?: any): void {
    const logEntry = this.formatMessage('INFO', message, data);
    console.log(message);
    if (data) console.log(data);
    this.writeToFile(logEntry);
  }

  error(message: string, error?: any): void {
    const logEntry = this.formatMessage('ERROR', message, error);
    console.error(message);
    if (error) console.error(error);
    this.writeToFile(logEntry);
  }

  success(message: string, data?: any): void {
    const logEntry = this.formatMessage('SUCCESS', message, data);
    console.log(message);
    if (data) console.log(data);
    this.writeToFile(logEntry);
  }

  private writeToFile(logEntry: string): void {
    try {
      writeFileSync(this.getLogFilePath(), logEntry, { flag: 'a' });
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }
}