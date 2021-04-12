import './App.css';
import AppBar from "./AppBar";
import {IconButton, makeStyles, TextField} from '@material-ui/core/index';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Page from './Page';
import Method from "./Method";
import React, { useEffect } from 'react';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import fetch from 'cross-fetch';

const useStyles = makeStyles({
    root: {
        overflowX: 'auto',
    },
    tableRow: {
        cursor: 'pointer',
    },
    expandButton: {
        marginRight: 7,
    },
    searchForm: {
        marginBottom: 20,
    },
    searchField: {
        width: "100%",
    },
    noResultsFound: {
        marginTop: 10,
        marginBottom: 10,
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

    const [data, setData] = React.useState({
        methods: [],
        expanded: [],
    });

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

        setHasSearched(true);

        /*elasticSearchRequest("methods/method", "POST", {
            repository: "CyC2018/CS-Notes",
            fileUrl: "https://github.com/CyC2018/CS-Notes/blob/master/.gitignore",
            returnType: "int",
            name: "testFunc",
            file: ".gitignore",
            lineNumber: 2,
            arguments: [
                {
                    type: "bool",
                    name: "opt1",
                },
                {
                    type: "String",
                    name: "strval1"
                }
            ]
        }).then((result) => {
            console.log(result);
        }, (error) => {
            console.log(error);
        });*/

        elasticSearchRequest("methods/_search", "POST", {"query": {
                "query_string": {
                    "query": searchInputValue
                }
            }
        }).then((result) => {
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
            });
        }, (error) => {
            console.log(error);
        });
    }

    return (
    <div className="App">
      <AppBar />
      <Page>
          <Paper className={classes.searchForm}>
              <form noValidate autoComplete="off" onSubmit={(e) => onFormSubmit(e)}>
                  <TextField
                      value={searchInputValue}
                      onInput={e => setSearchInputValue(e.target.value)}
                      className={classes.searchField}
                      id="outlined-basic"
                      label="Search"
                      variant="outlined" />
              </form>
          </Paper>


          <Paper className={classes.root}>
              {data.methods.length === 0 ? (
                  hasSearched &&
                    <Typography className={classes.noResultsFound}>No results found</Typography>
              ) : (
                  <Table>
                      <TableBody>
                          {data.methods.map((method, index) => (
                          <TableRow
                              hover={!data.expanded[index] ? true : undefined}
                              onClick={(e) => rowClick(e, index)}
                              key={index}
                              className={classes.tableRow}
                          >
                              <TableCell component="th" scope="row">
                                  <Typography
                                      color="textPrimary">
                                      <IconButton className={classes.expandButton} aria-label="expand row" size="small" onClick={(e) => rowClick(e, index)}>
                                          {data.expanded[index] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                      </IconButton>
                                      {method.toString()}
                                  </Typography>
                                  {data.expanded[index] && (
                                      <div
                                          onClick={(e) => {
                                              e.stopPropagation();
                                          }}
                                      >
                                          <hr />
                                          <p>Method name: {method.name}</p>
                                          <p>Return type: {method.returnType}</p>
                                          <p>Arguments: {method.arguments.map(arg => arg.toString()).join(', ')}</p>
                                          <p>Repository: <a rel="noreferrer" target="_blank" href={"https://github.com/" + method.repository}>{method.repository}</a></p>
                                          <p>File: <a rel="noreferrer" target="_blank" href={method.fileUrl}>{method.file}</a></p>
                                          <p>Line number: <a rel="noreferrer" target="_blank" href={method.fileUrl + "#L" + method.lineNumber}>{method.lineNumber}</a></p>
                                          <p><a rel="noreferrer" target="_blank" href={method.fileUrl + "#L" + method.lineNumber}>Go to code</a></p>
                                      </div>
                                  )}
                              </TableCell>
                          </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              )}
          </Paper>
      </Page>
    </div>
  );
}

export default App;