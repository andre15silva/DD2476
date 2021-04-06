# GJSE - GitHub Java code Search Engine
This repository is a part of our master's course in Search Engines and Information Retrieval.
The search engine uses Elastic Search to index GitHub and allow users to look for algorithms or specific methods (Java only)

# Run instructions
## Scanner
`python3 scanner/main.py --api-token <github api token> --indexer "java -cp indexer RepoDecoder" --limit 10`

The above assumes that RepoDecoder is compiled with `javac RepoDecoder`.

API tokens for GitHub can be created at [https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token)

# TODOs
1. Obtain a lot of Java files from Github (using Github API) (https://docs.github.com/en/rest/guides/getting-started-with-the-rest-api)
-We will give a list of URL (the parse will be in charge of downloading the file).
1. parse the files
    1. Which information do we want to get from each file?
        1. URL document
        1. Line of the code
        1. Method name
        1. Return type
        1. Modifiers
        1. Type arguments
        1. Comment of the function
        1. Javadocs
    1. How are we going to do the parse? Spoon?
1. JSON and POST it to Elastic Search
1. Create frontend
1. When the user does a search:
    1. Do a GET to elastic search with the needed filter
    1. Show the link in the specified line -> This could be improved
        1. Basically you just need to add link#L43 (being 43 the line of code where the function is).
1. Ranking 

## Suggested ElasticSearch index schema
```
{
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
}

```