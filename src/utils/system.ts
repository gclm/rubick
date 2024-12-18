import os from 'os';

interface Platform {
  macOS(): boolean;
  windows(): boolean;
  linux(): boolean;
}

export const platform: Platform = {
  macOS: (): boolean => os.type() === 'Darwin',
  windows: (): boolean => os.type() === 'Windows_NT',
  linux: (): boolean => os.type() === 'Linux'
};

export default platform; 