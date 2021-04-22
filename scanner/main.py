from githubclient import GithubClient
import argparse
from subprocess import Popen, PIPE, STDOUT


def get_fileurls(githubclient, response2, repo_url):
    files = []
    for j in response2:
        if j["type"] == "file":
            if j["name"].endswith(".java"):
                files.append((j["name"], j["git_url"]))
        elif j["type"] == "dir":
            dir_response = githubclient.get_files_recursively(j)
            if dir_response is None:
                continue
            for k in dir_response["tree"]:
                if k["type"] == "blob" and k["path"].endswith(".java"):
                    files.append((repo_url + "/" + j["name"] + "/" + k["path"], k["url"]))
    return files

def print_repoinfo(repository_name,repository_url,files):
    print(repository_name)
    print(repository_url)
    #print(files)

def run_indexer(binary, repository_name, repository_url, url_files):
    pipe = Popen(binary, shell=True, stdin=PIPE)
    pipe.stdin.write((repository_name + "\n").encode('utf-8'))
    pipe.stdin.write(repository_url.encode('utf-8'))
    for file in url_files:
        pipe.stdin.write(("\n" + file[0] + " " + file[1]).encode('utf-8'))
    pipe.stdin.close()


def main():

    #get authorization token from arguments
    parser = argparse.ArgumentParser(description='Process some integers.')
    parser.add_argument('--token-list',
                        help='File containing GitHub API tokens')
    parser.add_argument('--indexer',
                        help='Indexer binary to run and pass repositories to')
    parser.add_argument('--limit',
                        help='Limit the number of repositories to scan', nargs='?', default=-1, type=int)
    args = vars(parser.parse_args())

    limit = args["limit"]
    token_list_file = args["token_list"]
    token_list = []
    with open(token_list_file) as f:
        token_list = [line.rstrip() for line in f]

    # create GithubClient class
    github_client = GithubClient(token_list)

    # Calculate how many pages we need to iterate (max repos/page = 100)
    scanned_repos = 0
    page = 1
    while limit == -1 or scanned_repos < limit:
        limit_call = 100 if limit == -1 else min(100, limit - scanned_repos)
        list_repositories = github_client.get_repositories(limit_call, page)['items']
        print("Page number " + str(page) + ". Got " + str(len(list_repositories)) + " repositories")
        page += 1
        # for every repository get a list of URL of the files
        for i, repository_dict in enumerate(list_repositories):
            try:
                repository_name = repository_dict['full_name']
                repository_url = repository_dict["html_url"] + "/blob/" + repository_dict["default_branch"]
                respository_content = github_client.get_repository_content(repository_name)
                files = get_fileurls(github_client,respository_content, repository_url)
                run_indexer(args["indexer"], repository_name,repository_url,files)
                print_repoinfo(repository_name,repository_url,files)
            except:
                print(f"There was an error when indexing {repository_name}")


if __name__ == "__main__":
        main()
