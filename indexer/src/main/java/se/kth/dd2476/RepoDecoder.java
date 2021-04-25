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
        public String preview;
    }

    Scanner scanner;
    boolean scannerIsEmpty = false;
    String repoName;
    String repoURL;
    ArrayList<String> blobURLs = new ArrayList<>();
    ArrayList<String> properURLs = new ArrayList<>();
    ArrayList<String> tokens;

    public RepoDecoder(Scanner scanner, ArrayList<String> tokens) {
        this.scanner = scanner;
        this.tokens = tokens;
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
                if (index < blobURLs.size()) {
                    var decodedString = getDecodedString(blobURLs.get(index));
                    if(decodedString != null)
                        return new RepoFile(decodedString, properURLs.get(index++));
                    else{
                        return null;
                    }
                }
                index++;
                String fileProperURL = scanner.next();
                assert(scanner.hasNext());
                String fileBlobURL = scanner.next();
                properURLs.add(fileProperURL);
                blobURLs.add(fileBlobURL);
                var decodedString = getDecodedString(fileBlobURL);
                if(decodedString != null)
                    return new RepoFile(getDecodedString(fileBlobURL), fileProperURL);
                else{
                    index--;
                    return null;
                }
            }
        };
    }

    private File getDecodedString(String fileURL){
        return getDecodedString(fileURL, tokens.size());
    }

    /**
     * Given a github api ulr, decodes it and returns the relative code
     *
     * @param fileURL a url of a file of the type api.github.com/<user>/<repo>/blob/sha
     * @return A string with the code
     */
    private File getDecodedString(String fileURL, int count) {
        try {
            URL url = new URL(fileURL);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.addRequestProperty("Authorization",  "token " + tokens.get(0));
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
            //should be 403
            var tmp = tokens.get(0);
            tokens.remove(0);
            tokens.add(tmp);
            if(count > 0)
                return getDecodedString(fileURL, count - 1);
            return null;
        }
    }

    /**
     * Example of usage
     *
     * @param args The arguments from commandline, assume that the first argument is the token list filename
     */
    public static void main(String[] args) {
        assert(args.length > 0);
        ArrayList<String> tokens = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(args[0]))) {
            String line;
            while ((line = br.readLine()) != null) {
                tokens.add(line);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        Scanner input = new Scanner(System.in);
        var repoDecoder = new RepoDecoder(input, tokens);
        for (var repoFile : repoDecoder) {
            if (repoFile != null) {
                repoFile.repoName = repoDecoder.repoName;
                indexFile(repoFile);
                repoFile.file.delete();
            } else {
                System.err.println("We are out of token, going to sleep!");
                try {
                    Thread.sleep(1000 * 60 * 10); //sleep 10 minutes
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
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
        if (method.getVisibility() != null) {
            indexableMethod.visibility = method.getVisibility().toString();
        } else {
            indexableMethod.visibility = "";
        }
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

        method.setDocComment("");
        List<String> methodList = Arrays.asList(method.prettyprint().split("\n"));
        indexableMethod.preview = methodList.subList(3, Math.min(13, methodList.size())).stream().reduce((x, y) -> x + "\n" + y).get();

        Gson gson = new Gson();
        String json = gson.toJson(indexableMethod);
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
            if (!response.isSuccessful()) {
                System.out.println(body);
                System.out.println(response);
            }
            response.body().close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}
