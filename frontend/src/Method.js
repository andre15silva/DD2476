import Argument from "./Argument";

export default class Method {
  constructor() {
    this.name = null;
    this.returnType = null;
    this.arguments = [];
    this.repository = null;
    this.file = null;
    this.lineNumber = null;
    this.fileURL = null;
    this.visibility = null;
    this.javaDoc = null;
    this.modifiers = [];
    this.thrown = [];
    this.annotations = [];
    this.className = null;
    this.preview = null;
  }

  fromJson(json) {
    this.name = json.name;
    this.returnType = json.returnType;
    this.repository = json.repository;
    this.file = json.file;
    this.lineNumber = json.lineNumber;
    this.fileUrl = json.fileURL;
    this.visibility = json.visibility;
    this.javaDoc = json.javaDoc;
    this.modifiers = json.modifiers;
    this.thrown = json.thrown;
    this.annotations = json.annotations;
    this.className = json.className;
    if ("preview" in json && json.preview)
      this.preview = json.preview.split('\n').map((line, index) => `${index + 1} ${line}`).join('\n');

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
