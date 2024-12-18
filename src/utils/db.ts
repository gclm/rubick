/**
 * uTools DB API 兼容层
 */
export class DbWrapper {
  constructor(private db: any) {}

  // 基础 API - 直接传递 Promise
  async put(doc: any): Promise<any> {
    try {
      return await this.db.put(doc);
    } catch (e) {
      if (e instanceof Error) {
        return { error: true, message: e.message };
      }
      return { error: true, message: String(e) };
    }
  }

  async get(id: string) {
    try {
      return await this.db.get(id);
    } catch (e) {
      return null;
    }
  }

  async remove(doc: any) {
    try {
      return await this.db.remove(doc);
    } catch (e) {
      if (e instanceof Error) {
        return { error: true, message: e.message };
      }
      return { error: true, message: String(e) };
    }
  }

  async bulkDocs(docs: any[]) {
    try {
      return await this.db.bulkDocs(docs);
    } catch (e) {
      if (e instanceof Error) {
        return { error: true, message: e.message };
      }
      return { error: true, message: String(e) };
    }
  }

  async allDocs(options?: any) {
    try {
      return await this.db.allDocs(options);
    } catch (e) {
      if (e instanceof Error) {
        return { error: true, message: e.message };
      }
      return { error: true, message: String(e) };
    }
  }

  async postAttachment(docId: string, attachment: Buffer | Uint8Array, type: string) {
    try {
      return await this.db.postAttachment(docId, attachment, type);
    } catch (e) {
      if (e instanceof Error) {
        return { error: true, message: e.message };
      }
      return { error: true, message: String(e) };
    }
  }

  async getAttachment(docId: string) {
    try {
      return await this.db.getAttachment(docId);
    } catch (e) {
      return null;
    }
  }

  async getAttachmentType(docId: string) {
    try {
      return await this.db.getAttachmentType(docId);
    } catch (e) {
      return null;
    }
  }

  // promises API - 直接返回原始方法
  promises = {
    put: (doc: any) => this.put(doc),
    get: (id: string) => this.get(id),
    remove: (doc: any) => this.remove(doc),
    bulkDocs: (docs: any[]) => this.bulkDocs(docs),
    allDocs: (options?: any) => this.allDocs(options),
    postAttachment: (docId: string, attachment: Buffer | Uint8Array, type: string) =>
      this.postAttachment(docId, attachment, type),
    getAttachment: (docId: string) => this.getAttachment(docId),
    getAttachmentType: (docId: string) => this.getAttachmentType(docId)
  };
} 