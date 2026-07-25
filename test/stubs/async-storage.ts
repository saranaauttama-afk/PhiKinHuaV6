// In-memory stub แทน @react-native-async-storage/async-storage สำหรับเทสต์
// src/core/storage.ts เป็นไฟล์เดียวใน core ที่พึ่ง React Native

const mem = new Map<string, string>();

const AsyncStorage = {
  async getItem(key: string) {
    return mem.has(key) ? mem.get(key)! : null;
  },
  async setItem(key: string, value: string) {
    mem.set(key, value);
  },
  async removeItem(key: string) {
    mem.delete(key);
  },
  async getAllKeys() {
    return [...mem.keys()];
  },
  async clear() {
    mem.clear();
  },
};

export default AsyncStorage;
