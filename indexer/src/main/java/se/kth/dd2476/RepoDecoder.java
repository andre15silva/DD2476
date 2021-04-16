package se.kth.dd2476;

import com.google.gson.Gson;
import okhttp3.*;
import org.jetbrains.annotations.NotNull;
import spoon.Launcher;
import spoon.reflect.CtModel;
import spoon.reflect.declaration.*;
import spoon.reflect.reference.CtTypeReference;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.*;
import java.util.stream.Collectors;

/**
 * An iterable class to decode github files.
 * It reads from the given scanner the github api URLs
 * and provides an iterator for the code that will be extracted.
 */
public class RepoDecoder implements Iterable<RepoDecoder.RepoFile> {

    static class RepoFile {
        String repoName; //name of the repo
        String className; //name of the class
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

    private static class Argument {
        public String type;
        public String name;
    }

    private static class IndexableMethod {
        public String repository;
        public String className;
        public String fileURL;
        public String returnType;
        public String name;
        public String file;
        public String javaDoc;
        public Integer lineNumber;
        public String visibility;
        public List<String> modifiers;
        public List<Argument> arguments;
        public List<String> thrown;
        public List<String> annotations;
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
        for (var repoFile : repoDecoder) {
            repoFile.repoName = repoDecoder.repoName;
            indexFile(repoFile);
        }
    }

    private static void indexFile(RepoFile repoFile) {
	    Launcher launcher = new Launcher();

	    launcher.addInputResource(repoFile.file.getPath());
	    launcher.buildModel();

	    CtModel model = launcher.getModel();

	    for (CtType<?> type : model.getAllTypes())
            for (Object method : type.getMethods()) {
	            repoFile.className = type.getSimpleName();
	            indexMethod(repoFile, (CtMethod) method);
            }
    }

    private static void indexMethod(RepoFile repoFile, CtMethod method) {
        // Create indexable method
        IndexableMethod indexableMethod = new IndexableMethod();
        indexableMethod.repository = repoFile.repoName;
        indexableMethod.fileURL = repoFile.URL;
        indexableMethod.returnType = method.getType().getSimpleName();
        indexableMethod.name = method.getSimpleName();
        indexableMethod.className = repoFile.className;
        indexableMethod.file = repoFile.filename;
        indexableMethod.javaDoc = method.getDocComment();
        indexableMethod.lineNumber = method.getPosition().getLine();
        indexableMethod.visibility = method.getVisibility().toString();
        indexableMethod.modifiers = method.getModifiers()
                .stream().map(ModifierKind::toString).collect(Collectors.toList());

	    indexableMethod.arguments = new ArrayList<>();
        for (Object p : method.getParameters()) {
	        CtParameter parameter = (CtParameter) p;
	        Argument argument = new Argument();
	        argument.type = parameter.getType().toString();
	        argument.name = parameter.getSimpleName();
	        indexableMethod.arguments.add(argument);
        }

        indexableMethod.thrown =  new ArrayList<>();
        for (Object t : method.getThrownTypes()) {
            CtTypeReference type = (CtTypeReference) t;
            indexableMethod.thrown.add(type.getSimpleName());
        }

        indexableMethod.annotations = method.getAnnotations()
		        .stream().map(CtAnnotation::toString).collect(Collectors.toList());

        Gson gson = new Gson();
        String json = gson.toJson(indexableMethod);
        System.out.println(json);
        index("code/method/", json);
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
