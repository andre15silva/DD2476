import React from 'react';
import {Button, makeStyles, TextField} from '@material-ui/core/index';
import PropTypes from 'prop-types';
import Paper from "@material-ui/core/Paper";
import ButtonGroup from "@material-ui/core/ButtonGroup";

const useStyles = makeStyles({
  searchForm: {
    marginBottom: 20,
  },
  searchField: {
    width: "90%",
  },
  simpleSearchField: {
    marginLeft: 8,
    marginRight: 8,
    marginBottom: 8,
  }
});

function SearchForm({searchFunc}) {
  const classes = useStyles();

  const [advancedSearch, setAdvancedSearch] = React.useState(false);

  const [nameInputValue, setNameInputValue] = React.useState("");
  const [returnTypeInputValue, setReturnTypeInputValue] = React.useState("");
  const [repositoryInputValue, setRepositoryInputValue] = React.useState("");
  const [fileInputValue, setFileInputValue] = React.useState("");
  const [visibilityInputValue, setVisibilityInputValue] = React.useState("");
  const [javaDocInputValue, setJavaDocInputValue] = React.useState("");
  const [modifiersInputValue, setModifiersInputValue] = React.useState("");
  const [thrownInputValue, setThrownInputValue] = React.useState("");
  const [annotationsInputValue, setAnnotationsInputValue] = React.useState("");
  const [classNameInputValue, setClassNameInputValue] = React.useState("");
  const [argumentNameInputValue, setArgumentNameInputValue] = React.useState("");
  const [argumentTypeInputValue, setArgumentTypeInputValue] = React.useState("");

  const [searchInputValue, setSearchInputValue] = React.useState('');

  const escapeQueryString = query => {
    let escapedQuery = "";
    for (let i = 0; i < query.length; i++) {
      const c = query.charAt(i);
      if ( c === '[' || c === ']') {
        escapedQuery += '\\';
      }
      escapedQuery += c;
    }
    return escapedQuery;
  };

  const onFormSubmit = e => {
    e.preventDefault();

    let query;
    if (advancedSearch) {
      query = escapeQueryString(searchInputValue);
    } else {
      let queryParts = [];
      if (nameInputValue.length > 0) {
        queryParts.push("name:(" + escapeQueryString(nameInputValue) + ")");
      }
      if (returnTypeInputValue.length > 0) {
        queryParts.push("returnType:(" + escapeQueryString(returnTypeInputValue) + ")");
      }
      if (repositoryInputValue.length > 0) {
        queryParts.push("repository:(" + escapeQueryString(repositoryInputValue) + ")");
      }
      if (fileInputValue.length > 0) {
        queryParts.push("file:(" + escapeQueryString(fileInputValue) + ")");
      }
      if (visibilityInputValue.length > 0) {
        queryParts.push("visibility:(" + escapeQueryString(visibilityInputValue) + ")");
      }
      if (javaDocInputValue.length > 0) {
        queryParts.push("javaDoc:(" + escapeQueryString(javaDocInputValue) + ")");
      }
      if (modifiersInputValue.length > 0) {
        queryParts.push("modifiers:(" + escapeQueryString(modifiersInputValue) + ")");
      }
      if (thrownInputValue.length > 0) {
        queryParts.push("thrown:(" + escapeQueryString(thrownInputValue) + ")");
      }
      if (annotationsInputValue.length > 0) {
        queryParts.push("annotations:(" + escapeQueryString(annotationsInputValue) + ")");
      }
      if (classNameInputValue.length > 0) {
        queryParts.push("className:(" + escapeQueryString(classNameInputValue) + ")");
      }
      if (argumentNameInputValue.length > 0) {
        queryParts.push("arguments.name:(" + escapeQueryString(argumentNameInputValue) + ")");
      }
      if (argumentTypeInputValue.length > 0) {
        queryParts.push("arguments.type:(" + escapeQueryString(argumentTypeInputValue) + ")");
      }
      query = queryParts.join(' AND ');
      setSearchInputValue(query);
    }

    searchFunc(query);
  };

  return (
      <Paper className={classes.searchForm}>
        <form noValidate autoComplete="off" onSubmit={(e) => onFormSubmit(e)}>
          <ButtonGroup color="primary" aria-label="outlined primary button group">
            <Button onClick={() => setAdvancedSearch(!advancedSearch)} variant={advancedSearch ? "outlined" : "contained"}>Basic</Button>
            <Button onClick={() => setAdvancedSearch(!advancedSearch)} variant={advancedSearch ? "contained" : "outlined"}>Advanced</Button>
          </ButtonGroup>
          <br/> <br/>
          {advancedSearch ?
              <TextField
                  value={searchInputValue}
                  onInput={e => setSearchInputValue(e.target.value)}
                  className={classes.searchField}
                  id="outlined-basic"
                  label="Search"
                  variant="outlined" />
              :
              <React.Fragment>
                <TextField
                    className={classes.simpleSearchField}
                    value={nameInputValue}
                    onInput={e => setNameInputValue(e.target.value)}
                    id="outlined-basic"
                    label="Method name"
                    variant="outlined"
                    size={"small"} />
                <TextField
                    className={classes.simpleSearchField}
                    value={returnTypeInputValue}
                    onInput={e => setReturnTypeInputValue(e.target.value)}
                    id="outlined-basic"
                    label="Return type"
                    variant="outlined"
                    size={"small"} />
                <TextField
                    className={classes.simpleSearchField}
                    value={repositoryInputValue}
                    onInput={e => setRepositoryInputValue(e.target.value)}
                    id="outlined-basic"
                    label="Repository"
                    variant="outlined"
                    size={"small"} />
                <TextField
                    className={classes.simpleSearchField}
                    value={fileInputValue}
                    onInput={e => setFileInputValue(e.target.value)}
                    id="outlined-basic"
                    label="File name"
                    variant="outlined"
                    size={"small"} />
                <TextField
                    className={classes.simpleSearchField}
                    value={visibilityInputValue}
                    onInput={e => setVisibilityInputValue(e.target.value)}
                    id="outlined-basic"
                    label="Visibility"
                    variant="outlined"
                    size={"small"} />
                <TextField
                    className={classes.simpleSearchField}
                    value={javaDocInputValue}
                    onInput={e => setJavaDocInputValue(e.target.value)}
                    id="outlined-basic"
                    label="Javadoc"
                    variant="outlined"
                    size={"small"} />
                <TextField
                    className={classes.simpleSearchField}
                    value={modifiersInputValue}
                    onInput={e => setModifiersInputValue(e.target.value)}
                    id="outlined-basic"
                    label="Modifiers"
                    variant="outlined"
                    size={"small"} />
                <TextField
                    className={classes.simpleSearchField}
                    value={thrownInputValue}
                    onInput={e => setThrownInputValue(e.target.value)}
                    id="outlined-basic"
                    label="Throws"
                    variant="outlined"
                    size={"small"} />
                <TextField
                    className={classes.simpleSearchField}
                    value={annotationsInputValue}
                    onInput={e => setAnnotationsInputValue(e.target.value)}
                    id="outlined-basic"
                    label="Annotations"
                    variant="outlined"
                    size={"small"} />
                <TextField
                    className={classes.simpleSearchField}
                    value={classNameInputValue}
                    onInput={e => setClassNameInputValue(e.target.value)}
                    id="outlined-basic"
                    label="Class name"
                    variant="outlined"
                    size={"small"} />
                <TextField
                    className={classes.simpleSearchField}
                    value={argumentNameInputValue}
                    onInput={e => setArgumentNameInputValue(e.target.value)}
                    id="outlined-basic"
                    label="Argument name"
                    variant="outlined"
                    size={"small"} />
                <TextField
                    className={classes.simpleSearchField}
                    value={argumentTypeInputValue}
                    onInput={e => setArgumentTypeInputValue(e.target.value)}
                    id="outlined-basic"
                    label="Argument type"
                    variant="outlined"
                    size={"small"} />
              </React.Fragment>
          }
          <br/><br/>
          <Button color={"primary"}  variant={"contained"} type={"submit"}>Search</Button>
          <br/><br/>
        </form>
      </Paper>
  );
}

SearchForm.propTypes = {
  searchFunc: PropTypes.func
};

SearchForm.defaultProps = {
  searchFunc: null,
};

export default SearchForm;
