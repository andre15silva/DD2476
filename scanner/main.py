
from githubclient import GithubClient
import argparse
from subprocess import Popen, PIPE, STDOUT


def write_urls(repository_name, repository_url, url_files):
    f = open("repository"+ str(counter) +".txt", "w")
    f.write(repository_name + "\n")
    f.write(repository_url)
    for url in url_files:
        f.write("\n" + url)
    f.close()

def get_fileurls(githubclient, response2):
    files = []
    for j in response2:
        if j["type"] == "file":
            if j["name"].endswith(".java"):
                files.append(j["git_url"])
        elif j["type"] == "dir":
            dir_response = githubclient.get_files_recursively(j)
            if dir_response is None:
                continue
            for k in dir_response["tree"]:
                if k["type"] == "blob" and k["path"].endswith(".java"):
                    files.append(k["url"])
    return files

def print_repoinfo(repository_name,repository_url,files):
    print(repository_name)
    print(repository_url)
    #print(files)

def run_indexer(binary, repository_name, repository_url, url_files):
    pipe = Popen(binary, shell=True, stdin=PIPE)
    pipe.stdin.write((repository_name + "\n").encode('utf-8'))
    pipe.stdin.write(repository_url.encode('utf-8'))
    for url in url_files:
        pipe.stdin.write(("\n" + url).encode('utf-8'))
    pipe.stdin.close()


def main():

    #get authorization token from arguments
    parser = argparse.ArgumentParser(description='Process some integers.')
    parser.add_argument('--api-token',
                        help='GitHub API token')
    parser.add_argument('--indexer',
                        help='Indexer binary to run and pass repositories to')
    parser.add_argument('--limit',
                        help='Limit the number of repositories to scan', nargs='?', default=2, type=int)
    args = vars(parser.parse_args())

    limit = args["limit"]

    #create GithubClient class
    github_client = GithubClient(args["api_token"])
    list_repositories = github_client.get_repositories(limit)['items']

    print("Got " + str(len(list_repositories)) + " repositories")

    #for every repository get a list of URL of the files
    for i, repository_dict in enumerate(list_repositories):
        repository_name = repository_dict['full_name']
        repository_url = repository_dict["html_url"] + "/blob/" + repository_dict["default_branch"]
        respository_content = github_client.get_repository_content(repository_name)

        files = get_fileurls(github_client,respository_content)
        run_indexer(args["indexer"], repository_name,repository_url,files)
        print_repoinfo(repository_name,repository_url,files)


if __name__ == "__main__":
        main()