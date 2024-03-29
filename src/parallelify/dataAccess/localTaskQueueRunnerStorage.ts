import { TaskQueueRunner } from "../business/taskQueueRunner";
import { TaskQueueRunnerStorage } from "../business/interfaces";

import { Key } from "../../common";

export class LocalTaskQueueRunnerStorage implements TaskQueueRunnerStorage {
  private readonly storage: Record<Key, TaskQueueRunner>;

  constructor() {
    this.storage = {};
  }

  getOrCreate(
    key: Key,
    constructorParams: ConstructorParameters<typeof TaskQueueRunner>
  ) {
    const { value, found } = this.get(key);
    let ret = value;
    if (!found) {
      ret = new TaskQueueRunner(...constructorParams);
      this.set(key, ret);
    }
    return ret as TaskQueueRunner;
  }

  get(key: Key) {
    if (!(key in this.storage)) return { value: undefined, found: false };
    return { value: this.storage[key], found: true };
  }

  set(key: Key, value: TaskQueueRunner) {
    this.storage[key] = value;
  }

  delete(key: Key) {
    delete this.storage[key];
  }
}
