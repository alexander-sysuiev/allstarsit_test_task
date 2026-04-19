import type { Response } from 'express';

export class SseBroadcaster {
  private readonly clients = new Set<Response>();

  addClient(res: Response): void {
    this.clients.add(res);
  }

  removeClient(res: Response): void {
    this.clients.delete(res);
  }

  send<TPayload>(event: string, payload: TPayload): void {
    const body = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;

    for (const client of this.clients) {
      client.write(body);
    }
  }

  count(): number {
    return this.clients.size;
  }
}
