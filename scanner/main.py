
from githubclient import GithubClient
import argparse


def write_urls(repository_name,counter, repository_url, url_files):
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
    print(files)


def main(limit=2):

    #get authorization token from arguments
    parser = argparse.ArgumentParser(description='Process some integers.')
    parser.add_argument('--api-token',
                        help='GitHub API token')
    args = vars(parser.parse_args())

    #create GithubClient class
    github_client = GithubClient(args["api_token"])
    list_repositories = github_client.get_repositories()

    #for every repository get a list of URL of the files
    for i, repository_dict in enumerate(list_repositories['items']):
        repository_name = repository_dict['full_name']
        repository_url = repository_dict["html_url"] + "/blob/" + repository_dict["default_branch"]
        respository_content = github_client.get_repository_content(repository_name)

        files = get_fileurls(github_client,respository_content)
        write_urls(repository_name,i,repository_url,files)
        print_repoinfo(repository_name,repository_url,files)
        if i >= limit - 1:
            break


if __name__ == "__main__":
        main()
