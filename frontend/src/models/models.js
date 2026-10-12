export class Service {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
    }
}

export class Ticket {
    constructor(data) {
        Object.assign(this, data);
        this.createdAt = data.created_at;
    }
}

export class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.counterId = data.counterId;
    }
}