import Argument from "./Argument";

export default class Method {
  constructor() {
    this.name = null;
    this.returnType = null;
    this.arguments = [];
    this.repository = null;
    this.file = null;
    this.lineNumber = null;
    this.fileUrl = "null";
  }

  fromJson(json) {
    this.name = json.name;
    this.returnType = json.returnType;
    this.repository = json.repository;
    this.file = json.file;
    this.lineNumber = json.lineNumber;
    this.fileUrl = json.fileUrl;

    if ("arguments" in json) {
      this.arguments = [];
      json.arguments.forEach((argumentData) => {
        const argument = new Argument();
        argument.fromJson(argumentData);
        this.arguments.push(argument);
      });
    }
  }

  toString() {
    return this.returnType + " " + this.name + "(" + this.arguments.map(arg => arg.toString()).join(', ') + ")";
  }
}