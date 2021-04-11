package se.kth.dd2476;

import okhttp3.*;
import spoon.Launcher;
import spoon.reflect.declaration.*;
import spoon.reflect.reference.CtTypeReference;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Iterator;
import java.util.Scanner;

/**
 * An iterable class to decode github files.
 * It reads from the given scanner the github api URLs
 * and provides an iterator for the code that will be extracted.
 */
public class RepoDecoder implements Iterable<String> {

    Scanner scanner;
    boolean scannerIsEmpty = false;
    String name;
    ArrayList<String> URLs = new ArrayList<>();

    public RepoDecoder(Scanner scanner) {
        this.scanner = scanner;
        assert (scanner.hasNext());
        name = scanner.next();
    }

    @Override
    public Iterator<String> iterator() {
        return new Iterator<>() {
            int index = 0;

            @Override
            public boolean hasNext() {
                if (index < URLs.size())
                    return true;
                if (!scannerIsEmpty) {
                    scannerIsEmpty = !scanner.hasNext();
                    return !scannerIsEmpty;
                }
                return false;
            }

            @Override
            public String next() {
                if (index < URLs.size())
                    return getDecodedString(URLs.get(index++));
                index++;
                String fileURL = scanner.next();
                URLs.add(fileURL);
                return getDecodedString(fileURL);
            }
        };
    }

    /**
     * Given a github api ulr, decodes it and returns the relative code
     *
     * @param fileURL a url of a file of the type api.github.com/<user>/<repo>/blob/sha
     * @return A string with the code
     */
    private String getDecodedString(String fileURL) {
        try {
            URL url = new URL(fileURL);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.connect();
            BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            String inputLine;
            StringBuilder response = new StringBuilder();
            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
            in.close();
            var content = response.toString();
            if (!content.contains("content")) {
                System.err.println("Retrieved non-standard json:\n" + content);
                return null;
            }
            content = content.split("content\":\"")[1].split("\"")[0];
            var stringBuilder = new StringBuilder();
            var decoder = Base64.getMimeDecoder();
            for (var line : content.split("\\\\n")) {
                stringBuilder.append(new String(decoder.decode(line)));
            }
            return stringBuilder.toString();
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Example of usage
     *
     * @param args
     */
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        var repoDecoder = new RepoDecoder(input);
        for (String code : repoDecoder) {
            spoonDoesSomething(repoDecoder.name, code);
        }

    }

    private static void spoonDoesSomething(String repo, String code) {
        CtClass klass = Launcher.parseClass(code);

        //indexClass(klass);

        for (Object method : klass.getAllMethods()) {
            indexMethod(repo, (CtMethod) method);
        }
    }

    private static void indexClass(CtClass klass) {
        // Do something ?
    }

    private static void indexMethod(String repo, CtMethod method) {
        // Create base properties body
        String body = "{\n" +
                "   \"repository\": \"" + repo + "\",\n" +
                "   \"fileUrl\": \"" + "url" + "\",\n" +
                "   \"returnType\": \"" + method.getType().getSimpleName() + "\",\n" +
                "   \"name\": \"" + method.getSimpleName() + "\",\n" +
                "   \"file\": \"" + "file" + "\",\n" +
                //"   \"lineNumber\": " + method.getPosition() + "\",\n";
                "   \"visibility\": \"" + method.getVisibility() + "\",\n";

        // Create modifiers list
        body += "   \"modifiers\": [\n";
        for (ModifierKind modifier : method.getModifiers()) {
            body += "       \"" + modifier.toString() + "\",\n";
        }
        body = body.replaceAll(",\n$", "\n");
        body += "   ],\n";

        // Create args list
        body += "   \"arguments\": [\n";
        for (Object p : method.getParameters()) {
            CtParameter parameter = (CtParameter) p;
            body += "       {\n" +
                    "           \"type\": \"" + parameter.getType() + "\",\n" +
                    "           \"name\": \"" + parameter.getSimpleName() + "\",\n" +
                    "       },\n";
        }
        body = body.replaceAll(",\n$", "\n");
        body += "   ],\n";

        // Create thrown types list
        body += "   \"throws\": [\n";
        for (Object t : method.getThrownTypes()) {
            CtTypeReference type = (CtTypeReference) t;
            body += "       \"" + type.getSimpleName() + "\",\n";
        }
        body = body.replaceAll(",\n$", "\n");
        body += "   ],\n";

        // Create annotations list
        body += "   \"annotations\": [\n";
        for (CtAnnotation annotation : method.getAnnotations()) {
            body += "       \"" + annotation + "\",\n";
        }
        body = body.replaceAll(",\n$", "\n");
        body += "   ]\n";

        body += "}";

        System.out.println(body);

        index("code/method/", body);
    }

    private static void index(String path, String body) {
        OkHttpClient client = new OkHttpClient();

        MediaType JSON = MediaType.get("application/json; charset=utf-8");
        RequestBody requestBody = RequestBody.create(body, JSON);

        Request request = new Request.Builder()
                .url("http://localhost:9200/" + path)
                .post(requestBody)
                .build();

        try {
            Call call = client.newCall(request);
            Response response = call.execute();
            System.out.println(response);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

}