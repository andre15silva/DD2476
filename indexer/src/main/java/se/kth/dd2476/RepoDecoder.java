package se.kth.dd2476;

import okhttp3.*;
import org.jetbrains.annotations.NotNull;
import spoon.reflect.declaration.*;
import spoon.reflect.reference.CtTypeReference;

import java.io.*;
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
public class RepoDecoder implements Iterable<RepoDecoder.RepoFile> {

    static class RepoFile{
        File file; //file with the code
        String filename; //name of the file
        String URL; //github proper url

        public RepoFile(File file, String URL) {
            this.file = file;
            this.URL = URL;
            var brokenURL = URL.split("/");
            filename = brokenURL[brokenURL.length - 1];
        }
    }

    Scanner scanner;
    boolean scannerIsEmpty = false;
    String repoName;
    String repoURL;
    ArrayList<String> blobURLs = new ArrayList<>();
    ArrayList<String> properURLs = new ArrayList<>();

    public RepoDecoder(Scanner scanner) {
        this.scanner = scanner;
        assert (scanner.hasNext());
        repoName = scanner.next();
        assert (scanner.hasNext());
        repoURL = scanner.next();
    }

    @NotNull
    @Override
    public Iterator<RepoFile> iterator() {
        return new Iterator<>() {
            int index = 0;

            @Override
            public boolean hasNext() {
                if (index < blobURLs.size())
                    return true;
                if (!scannerIsEmpty) {
                    scannerIsEmpty = !scanner.hasNext();
                    return !scannerIsEmpty;
                }
                return false;
            }

            @Override
            public RepoFile next() {
                if (index < blobURLs.size())
                    return new RepoFile(getDecodedString(blobURLs.get(index)), properURLs.get(index++));
                index++;
                String fileProperURL = scanner.next();
                assert(scanner.hasNext());
                String fileBlobURL = scanner.next();
                properURLs.add(fileProperURL);
                blobURLs.add(fileBlobURL);
                return new RepoFile(getDecodedString(fileBlobURL), fileProperURL);
            }
        };
    }

    /**
     * Given a github api ulr, decodes it and returns the relative code
     *
     * @param fileURL a url of a file of the type api.github.com/<user>/<repo>/blob/sha
     * @return A string with the code
     */
    private File getDecodedString(String fileURL) {
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
            var tmp_filename = "java_reconstructed_file" + ProcessHandle.current().pid() + ".java";
            File result = new File(tmp_filename);
            if(result.exists())
                if(result.delete())
                    if(!result.createNewFile())
                        System.err.println("Unable to create temporary file with the java code");
            var writer = new FileWriter(tmp_filename);
            writer.write(stringBuilder.toString());
            writer.close();
            return result;
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
        for (var code : repoDecoder) {
            spoonDoesSomething(repoDecoder.repoName, code);
        }
    }

    private static void spoonDoesSomething(String repo, RepoFile code) {
//        CtClass klass = Launcher.parseClass(code); //todo: change to parse file
//
//        for (Object method : klass.getAllMethods()) {
//            indexMethod(repo, (CtMethod) method);
//        }
    }

    private static void indexMethod(String repo, CtMethod method) {
        // Create base properties body
        String body = "{\n" +
                "   \"repository\": \"" + repo + "\",\n" +
                "   \"fileUrl\": \"" + "url" + "\",\n" +
                "   \"returnType\": \"" + method.getType().getSimpleName() + "\",\n" +
                "   \"name\": \"" + method.getSimpleName() + "\",\n" +
                "   \"file\": \"" + "file" + "\",\n" +
                "   \"javaDoc\": \"" + method.getDocComment() + "\",\n" +
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
