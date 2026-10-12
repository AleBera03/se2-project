class Service {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
    }
}

class Ticket {
    constructor(data) {
        Object.assign(this, data);
        this.createdAt = data.created_at;
    }
}

class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.counterId = data.counterId;
    }
}

export {
    Service,
    Ticket,
    User
};