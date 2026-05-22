import { IEventStream } from './interfaces';
import { OrchestratorGraph } from '@molen/shared-types';

export class MockEventStream implements IEventStream {
  public lastPublishedTopic: string | null = null;
  public lastPublishedGraph: OrchestratorGraph | null = null;

  async publishDeployment(topic: string, graph: OrchestratorGraph): Promise<void> {
    this.lastPublishedTopic = topic;
    this.lastPublishedGraph = graph;
  }
}
