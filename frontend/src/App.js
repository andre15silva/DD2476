import './App.css';
import AppBar from "./AppBar";
import {makeStyles} from '@material-ui/core/index';
import Typography from '@material-ui/core/Typography';
import Page from './Page';
import Method from "./Method";
import React  from 'react';
import fetch from 'cross-fetch';
import SearchResults from "./SearchResults";
import SearchForm from "./SearchForm";

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
    const [data, setData] = React.useState({
        count: 0,
        methods: [],
        expanded: [],
        queryTime: 0,
        error: false,
    });

    const [hasSearched, setHasSearched] = React.useState(false);

    const rowClick = (e, index) => {
        e.stopPropagation();
        const newData = {...data};
        newData.expanded[index] = !data.expanded[index];
        setData(newData);
    }

    const searchFunc = query => {
        elasticSearchRequest("code/method/_search", "POST", {
            "query": {
                "query_string": {
                    "query": query
                }
            },
            "from" : 0,
            "size" : 100,
            "track_total_hits": true,
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

            console.log(result);
            setData({
                count: result.hits.total.value,
                methods: methods,
                expanded: expanded,
                queryTime:result.took,
                error: false,
            });
        }, (error) => {
            console.log(error);
            setData({
                count: 0,
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
          <SearchForm searchFunc={searchFunc} />

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
