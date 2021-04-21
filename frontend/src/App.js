import './App.css';
import AppBar from "./AppBar";
import {Button, makeStyles, TextField} from '@material-ui/core/index';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Page from './Page';
import Method from "./Method";
import React  from 'react';
import fetch from 'cross-fetch';
import SearchResults from "./SearchResults";
import ButtonGroup from '@material-ui/core/ButtonGroup';

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

function responseIsJson(response) {
    const contentType = response.headers.get('content-type');
    return contentType && contentType.indexOf('application/json') !== -1;
}

function elasticSearchRequest(resource, method = 'GET', body = null) {
    const headers = {};

    if (body != null) {
        headers['Content-Type'] = 'application/json';
    }

    const props = {
        method,
        headers,
    };

    if (body) {
        props.body = JSON.stringify(body);
    }

    const url = 'http://localhost:9200/' + resource;

    return new Promise((resolve, reject) => {

        fetch(url, props).then((res) => {
            if (res.ok) {
                if (responseIsJson(res)) {
                    res.json().then((json) => {
                        resolve(json);
                    });
                } else {
                    reject(res);
                }
            } else {
                if (responseIsJson(res)) {
                    res.json().then((json) => {
                        reject(json);
                    });
                } else {
                    reject(res);
                }
            }
        },
        (error) => {
            reject(error);
        });
    });
}

function App() {
    const classes = useStyles();

    const [advancedSearch, setAdvancedSearch] = React.useState(false);

    const [data, setData] = React.useState({
        methods: [],
        expanded: [],
        queryTime: 0,
        error: false,
    });


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

    const [hasSearched, setHasSearched] = React.useState(false);

    function rowClick(e, index) {
        e.stopPropagation();
        const newData = {...data};
        newData.expanded[index] = !data.expanded[index];
        setData(newData);
    }

    function onFormSubmit(e) {
        e.preventDefault();

        let query;
        if (advancedSearch) {
            query = searchInputValue;
        } else {
            let queryParts = [];
            if (nameInputValue.length > 0) {
                queryParts.push("name:(" + nameInputValue + ")");
            }
            if (returnTypeInputValue.length > 0) {
                queryParts.push("returnType:(" + returnTypeInputValue + ")");
            }
            if (repositoryInputValue.length > 0) {
                queryParts.push("repository:(" + repositoryInputValue + ")");
            }
            if (fileInputValue.length > 0) {
                queryParts.push("file:(" + fileInputValue + ")");
            }
            if (visibilityInputValue.length > 0) {
                queryParts.push("visibility:(" + visibilityInputValue + ")");
            }
            if (javaDocInputValue.length > 0) {
                queryParts.push("javaDoc:(" + javaDocInputValue + ")");
            }
            if (modifiersInputValue.length > 0) {
                queryParts.push("modifiers:(" + modifiersInputValue + ")");
            }
            if (thrownInputValue.length > 0) {
                queryParts.push("thrown:(" + thrownInputValue + ")");
            }
            if (annotationsInputValue.length > 0) {
                queryParts.push("annotations:(" + annotationsInputValue + ")");
            }
            if (classNameInputValue.length > 0) {
                queryParts.push("className:(" + classNameInputValue + ")");
            }
            if (argumentNameInputValue.length > 0) {
                queryParts.push("arguments.name:(" + argumentNameInputValue + ")");
            }
            if (argumentTypeInputValue.length > 0) {
                queryParts.push("arguments.type:(" + argumentTypeInputValue + ")");
            }
            query = queryParts.join(' AND ');
            setSearchInputValue(query);
        }

        elasticSearchRequest("code/method/_search", "POST", {
            "query": {
                "query_string": {
                    "query": query
                }
            },
            "from" : 0,
            "size" : 100,
            }
        ).then((result) => {
            setHasSearched(true);

            let methods = [];
            let expanded = [].fill(false, 0, result.hits.hits.length);
            result.hits.hits.forEach(hit => {
                const method = new Method();
                method.fromJson(hit._source);
                methods.push(method);
            });

            setData({
                methods: methods,
                expanded: expanded,
                queryTime:result.took,
                error: false,
            });
        }, (error) => {
            console.log(error);
            setData({
                methods: [],
                expanded: [],
                queryTime: 0,
                error: true
            });
        });
    }

    return (
    <div className="App">
      <AppBar />
      <Page>
          <Paper className={classes.searchForm}>
              <form noValidate autoComplete="off" onSubmit={(e) => onFormSubmit(e)}>
                  <ButtonGroup color="primary" aria-label="outlined primary button group">
                      <Button onClick={() => setAdvancedSearch(!advancedSearch)} variant={advancedSearch ? "outlined" : "contained"}>Simple</Button>
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

          {data.error &&
            <Typography color={"error"}>An error occurred</Typography>
          }

          {hasSearched &&
            <SearchResults data={data} rowClick={rowClick}/>
          }
      </Page>
    </div>
  );
}

export default App;
