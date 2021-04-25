import React from 'react';
import {IconButton, makeStyles} from '@material-ui/core/index';
import PropTypes from 'prop-types';
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";

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
  noResultsFound: {
    marginTop: 10,
    marginBottom: 10,
  },
  queryTime: {
    textAlign: 'left',
    marginBottom: 5,
  },
  codeBlock: {
    backgroundColor: "#ededed",
    paddingLeft:8,
    paddingRight:8,
    paddingTop: 1,
    paddingBottom: 1,
    marginLeft: 0,
    marginRight: 0,
    borderRadius: 5,
  }
});

function SearchResults({data, rowClick}) {
  const classes = useStyles();

  return (
    <div>
        <Typography color={"textSecondary"} className={classes.queryTime}>Showing {data.methods.length} results out of {data.count} in {data.queryTime} ms</Typography>
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
                                  <p>Class name: {method.className}</p>
                                  <p>Repository: <a rel="noreferrer" target="_blank" href={"https://github.com/" + method.repository}>{method.repository}</a></p>
                                  <p>File: <a rel="noreferrer" target="_blank" href={method.fileUrl}>{method.file}</a></p>
                                  <p>Line number: <a rel="noreferrer" target="_blank" href={method.fileUrl + "#L" + method.lineNumber}>{method.lineNumber}</a></p>
                                  <p><a rel="noreferrer" target="_blank" href={method.fileUrl + "#L" + method.lineNumber}>Go to code</a></p>
                                  <div className={classes.codeBlock}>
                                     <pre>
                                       <code>{method.preview}</code>
                                     </pre>
                                    <p><a rel="noreferrer" target="_blank" href={method.fileUrl + "#L" + method.lineNumber}>View more on GitHub...</a></p>
                                  </div>
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
  );
}

SearchResults.propTypes = {
  rest: PropTypes.object,
  rowClick: PropTypes.func
};

SearchResults.defaultProps = {
  data: {
    methods: [],
    expanded: [],
    queryTime: 0,
    error: false,
  },
  rowClick: null,
};

export default SearchResults;
