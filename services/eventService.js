import EventEmitter from 'events';

class EventService extends EventEmitter {
  constructor() {
    super();
  }
}

const eventService = new EventService();
export default eventService;
