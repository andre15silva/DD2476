import React from 'react';
import { makeStyles } from '@material-ui/core/index';
import PropTypes from 'prop-types';

const useStyles = makeStyles({
  root: {
    padding: 20,
  },
});

function Page({ children, ...rest }) {
  const classes = useStyles();

  const newRest = rest;
  const restClassName = rest.className;
  let classNames = classes.root;
  if (restClassName) {
    classNames += ` ${restClassName}`;
  }

  newRest.className = classNames;

  return (
    <div {...newRest}>
      {children}
    </div>
  );
}

Page.propTypes = {
  children: PropTypes.node,
  rest: PropTypes.any,
};

Page.defaultProps = {
  children: null,
  rest: {},
};

export default Page;
