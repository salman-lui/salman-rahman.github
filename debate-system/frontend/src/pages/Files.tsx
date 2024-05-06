import { useLoaderData } from "react-router-dom";
import { parseISO, format } from "date-fns";
import Link from "../components/Link";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export async function filesLoader() {
  try {
    const response = await fetch("/api/files");
    const files = await response.json();
    return { files };
  } catch (error) {
    console.error("Error:", error);
  }
}

type File = {
  id: number;
  path: string;
  path_hash: string;
  row_count: number;
  created_at: string;
  imported_at: string;
};

type FileTree = {
  [key: string]: FileTree | File;
};

function createTree(files: File[]): FileTree {
  const tree: FileTree = {};

  files.forEach((file) => {
    // Trim beginning /
    const path = file.path.startsWith("/") ? file.path.slice(1) : file.path;
    const pathParts = path.split("/");
    let currentLevel = tree;

    pathParts.forEach((part, index) => {
      if (index === pathParts.length - 1) {
        currentLevel[part] = file;
      } else if (!currentLevel[part]) {
        currentLevel[part] = {};
      }

      if (
        typeof currentLevel[part] === "object" &&
        !("path" in currentLevel[part])
      ) {
        currentLevel = currentLevel[part] as FileTree;
      }
    });
  });

  return tree;
}

const formatDate = (timestamp: string) => {
  const date = parseISO(timestamp);
  return format(date, "MMMM do yyyy");
};

const isDirectory = (treeNode: FileTree | File) => {
  return typeof treeNode === "object" && !("path" in treeNode);
};

const urlStyle = "text-blue-600 underline hover:text-blue-800  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"

function DirectoryTree({ tree, path = "" }: { tree: FileTree; path?: string }) {
  const dirs = Object.keys(tree).filter((key) => isDirectory(tree[key]));
  const files = Object.keys(tree).filter((key) => !isDirectory(tree[key]));
  return (
    <div className="mt-2 flex flex-col space-y-2">
      {dirs.map((key) => (
        <div key={key}>
          <Disclosure>
            {({ open }) => (
              <div className="">
                <Disclosure.Button className="flex justify-between w-full rounded px-4 py-2 text-sm font-medium text-left text-black bg-blue-100 hover:bg-blue-200 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                  <div>
                    <span className="text-gray-500 mr-4">
                      {Object.keys(tree[key]).length}
                    </span>
                    <span>{key}</span>
                  </div>
                  <ChevronDownIcon
                    className={`${open ? "transform rotate-180" : ""
                      } w-5 h-5 text-black`}
                  />
                </Disclosure.Button>
                <Disclosure.Panel className="px-2  text-sm text-gray-500">
                  <DirectoryTree
                    tree={tree[key] as FileTree}
                    path={`${path}/${key}`}
                  />
                </Disclosure.Panel>
              </div>
            )}
          </Disclosure>
        </div>
      ))}
      <div>
        {files.map((key) => (
          <div key={key}>
            <Link
              to={`/files/${(tree[key] as File).path_hash.slice(0, 8)}`}
              className="block px-4 py-2 text-sm text-black hover:bg-gray-200 flex justify-between"
            >
              <div>
                <span className="mr-4 text-gray-500">
                  {(tree[key] as File).row_count}
                </span>
                <span>{key}</span>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
function getRootAndFirstBranches(tree: FileTree, maxDepth = 1000) {
  let root = "/";
  let currentNode = tree;
  let depth = 0;

  while (depth < maxDepth) {
    const entries = Object.entries(currentNode);
    if (entries.length > 1 || !isDirectory(currentNode)) {
      return [root, currentNode];
    }
    const [dirName, dir] = entries[0];
    if (!isDirectory(dir)) {
      return [root, currentNode];
    }
    root = root.concat(`${dirName}/`);
    currentNode = dir;
    depth++;
  }
  console.warn("No branching node found");
  return [null, null];
}

function Files() {
  const { files } = useLoaderData();
  if (!files.length) {
    return <div className="px-8 py-4">No files found.</div>;
  }
  let tree = createTree(files);
  const [root, firstBranchingNode] = getRootAndFirstBranches(tree);
  return (
    <div className="mt-8 px-4">
      <p>Human results from <a href="https://github.com/ucl-dark/llm_debate/blob/main/paper.pdf" className={urlStyle}>"Debating with More Persuasive LLMs Leads to More Truthful Answers"</a>. See Appendix B.5 for a detailed description of all human experiments.</p>
      <p>Download the entire dataset <a href="https://github.com/ucl-dark/llm_debate/tree/main/data" className={urlStyle}>here</a>, and see the dataset Readme <a href="https://github.com/ucl-dark/llm_debate/blob/main/data/dataset_readme.md#judgements-used-for-analysis-in-the-paper" className={urlStyle}>here</a>.</p>
      <p className="mb-8">Experiment 8 contains the main results from the paper and is likely the most interesting to browse.</p>
      {files && files.length && <DirectoryTree tree={firstBranchingNode} />}
    </div>
  );
}

export default Files;
