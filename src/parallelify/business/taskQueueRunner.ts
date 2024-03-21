import { Task } from "./interfaces";

export class TaskQueueRunner {
  private readonly taskQueue: Task[] = [];
  private runningPromises = 0;
  private readonly concurrency: number;
  private readonly onFinished: () => void;

  constructor({
    concurrency,
    onFinished,
  }: {
    concurrency: number;
    onFinished: () => void;
  }) {
    this.concurrency = concurrency;
    this.onFinished = onFinished;
  }

  push(task: Task) {
    this.taskQueue.push(task);
    this.runNextTasks();
  }

  private async runNextTasks() {
    while (this.runningPromises < this.concurrency && this.taskQueue.length) {
      const task = this.taskQueue.shift() as Task;
      const promise = task();
      promise
        .finally(() => {
          this.runningPromises--;
          if (this.taskQueue.length) this.runNextTasks();
          else this.onFinished();
        })
        .catch(() => {
          return;
        });
      this.runningPromises++;
    }
  }
}
