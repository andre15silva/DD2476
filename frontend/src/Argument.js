export default class Argument {
  constructor() {
    this.name = null;
    this.type = null;
  }

  fromJson(json) {
    this.name = json.name;
    this.type = json.type;
  }

  toString() {
    return this.type + " " + this.name;
  }
}
