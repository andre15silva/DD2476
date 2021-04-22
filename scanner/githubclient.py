import sys
import requests
import json

class GithubClient:
    """GithubClient performs operations using Github API"""

    def __init__(self, token_list):
        """
        :param token_list (str): List of Github API tokens
        """
        self.token_index = 0
        self.token_list = token_list

    def get_repositories(self, limit, page):
        response = self._place_get_api(
            "https://api.github.com/search/repositories?q=language:Java&sort=stars&order=desc&page=" + str(
                page) + "&per_page=" + str(limit))
        if response is None:
            sys.exit("Request error in getting repositories")
        return response

    def get_repository_content(self,repository_name):
        response = self._place_get_api("https://api.github.com/repos/" + repository_name + "/contents")
        if response is None:
            sys.exit("Request error in getting respositories content")
        return response

    def get_files_recursively(self, directory_dict):
        response = self._place_get_api(directory_dict["_links"]["git"] + "?recursive=1")
        if response is None:
            sys.exit("Request error in getting files recursively")
        return response

    def _place_get_api(self,url):
        response = requests.get(url, headers={"Authorization": "token " + self.token_list[self.token_index]})
        if response.status_code >= 300:
            if response.status_code == 403:
                if self.token_index == len(self.token_list) - 1:
                    print("Out of GitHub API tokens. Going back to the first...")
                    self.token_index = 0
                    return self._place_get_api(url)
                else:
                    print("Using token # " + str(self.token_index))
                    self.token_index += 1
                    return self._place_get_api(url)
            else:
                print("Request failed for url {}".format(url))
                return None
        return json.loads(response.content)
