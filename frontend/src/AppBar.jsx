import React from 'react';
import MaterialAppBar from '@material-ui/core/AppBar';
import { makeStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1,
  },
  title: {
    marginRight: 30,
  },
  toolbarLinkIcon: {
    marginRight: 5,
  },
}));

function AppBar() {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <MaterialAppBar position="static">
        <Toolbar>
          <Typography variant="h6" className={classes.title}>
            GitHub Search Project
          </Typography>
        </Toolbar>
      </MaterialAppBar>
    </div>
  );
}

export default AppBar;
