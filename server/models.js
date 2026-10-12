class Service {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

class Ticket {
    constructor(data) {
        Object.assign(this, data);
    }
}

class User {
    constructor(id, username, counterId) {
        this.id = id;
        this.username = username;
        this.counterId = counterId;
    }
}

export {
    Service,
    Ticket,
    User
};