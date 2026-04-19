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
    const body = this.format(event, payload);
    for (const client of this.clients) {
      client.write(body);
    }
  }

  sendTo<TPayload>(res: Response, event: string, payload: TPayload): void {
    res.write(this.format(event, payload));
  }

  count(): number {
    return this.clients.size;
  }

  private format<TPayload>(event: string, payload: TPayload): string {
    return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  }
}
