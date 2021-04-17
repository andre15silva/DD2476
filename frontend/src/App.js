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
    },
    queryTime: {
        textAlign: 'left',
        marginBottom: 5,
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
        queryTime: 0,
        error: false,
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

        elasticSearchRequest("code/method/_search", "POST", {
            "query": {
                "query_string": {
                    "query": searchInputValue
                }
            },
            "from" : 0,
            "size" : 1000,
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
                  <TextField
                      value={searchInputValue}
                      onInput={e => setSearchInputValue(e.target.value)}
                      className={classes.searchField}
                      id="outlined-basic"
                      label="Search"
                      variant="outlined" />
              </form>
          </Paper>

          {data.error &&
            <Typography color={"error"}>An error occurred</Typography>
          }

          {hasSearched &&
            <div>
                <Typography color={"textSecondary"} className={classes.queryTime}>{data.methods.length} results in {data.queryTime} ms</Typography>
                <Paper className={classes.root}>
                    {data.methods.length === 0 ? (
                        <Typography className={classes.noResultsFound}>No results found</Typography>
                    ) : (
                        <div>
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
                                                </Typography> <Typography color={"textSecondary"}>Defined in class {method.className} in repository {method.repository}</Typography>
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
                                                        <p>Visibility: {method.visibility}</p>
                                                        <p>Javadoc: {method.javaDoc}</p>
                                                        <p>Modifiers: {method.modifiers.join(', ')}</p>
                                                        <p>Throws: {method.thrown.join(', ')}</p>
                                                        <p>Annotations: {method.annotations.join(', ')}</p>
                                                        <p>Class name {method.className}</p>
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
                        </div>
                    )}
                </Paper>
            </div>
          }

      </Page>
    </div>
  );
}

export default App;
