import sys
import requests
import json

class GithubClient:
    """GithubClient performs operations using Github API"""

    def __init__(self,authorization_token):
        """
        :param authorization_token (str): Github API token
        """
        self.authorization_token = authorization_token

    def get_repositories(self):
        response = self._place_get_api("https://api.github.com/search/repositories?q=algorithms%20language:Java")
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
        response = requests.get(url, headers={"Authorization": "token " + self.authorization_token})
        if response.status_code >= 300:
            print("Request failed for url {}".format(url))
            return None
        return json.loads(response.content)