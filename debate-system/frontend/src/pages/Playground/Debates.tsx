import { useEffect, useState } from "react";
import Select from "../../components/Select";
import Button from "../../components/Button";
import { useTypedLoaderData } from "../../utils/types";
import useCreatePlaygroundDebate from "../../hooks/createPlaygroundDebate";

export async function playgroundDebatesLoader() {
  try {
    const debaterConfigsRequest = fetch(`/api/playground/debater_configs`);

    const [configsResponse] = await Promise.all([debaterConfigsRequest]);

    const configs = await configsResponse.json();

    return {
      debaterConfigs: {
        debater_configs: configs.debater_configs.sort(),
        consultant_configs: configs.consultant_configs.sort(),
      },
    };
  } catch (error) {
    console.error("Error:", error);
  }
}

const debateTypes = [
  { label: "Debate", value: "debate" },
  { label: "Consultancy", value: "consultancy" },
  { label: "Correct Consultancy", value: "correct_consultancy" },
  { label: "Incorrect Consultancy", value: "incorrect_consultancy" },
];

export default function PlaygroundDebates() {
  const { debaterConfigs: configs } = useTypedLoaderData();
  const [selectedDebateType, setSelectedDebateType] = useState(
    debateTypes[0].value,
  );
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const createDebate = useCreatePlaygroundDebate();

  useEffect(() => {
    // Make sure a correct config for the debate type is always selected
    if (!configs || !debateTypes) {
      return;
    }
    if (selectedDebateType === debateTypes[0].value) {
      if (
        !selectedConfig ||
        !configs.debater_configs.includes(selectedConfig)
      ) {
        setSelectedConfig(configs.debater_configs[0]);
      }
    } else {
      if (
        !selectedConfig ||
        !configs.consultant_configs.includes(selectedConfig)
      ) {
        setSelectedConfig(configs.consultant_configs[0]);
      }
    }
  }, [configs, debateTypes, selectedDebateType]);

  if (!debateTypes || !configs) {
    return <span>Loading...</span>;
  }
  const {
    debater_configs: debaterConfigs,
    consultant_configs: consultantConfigs,
  } = configs;

  return (
    <div className="py-8 mt-12">
      <div className="flex flex-row justify-center items-end mb-16">
        <Select
          value={selectedDebateType}
          label="Debate type"
          className="mr-2"
          onChange={(e) => setSelectedDebateType(e.target.value)}
        >
          {debateTypes.map((debateType) => (
            <option key={debateType.label} value={debateType.value}>
              {debateType.label}
            </option>
          ))}
        </Select>
        <Select
          value={selectedConfig || ""}
          label="Config"
          className="mr-2"
          onChange={(e) => setSelectedConfig(e.target.value)}
        >
          {selectedDebateType === debateTypes[0].value ? (
            <optgroup label="Debater configs">
              {debaterConfigs.map((config: string) => (
                <option key={config} value={config}>
                  {config.split('/').pop().split('.yaml')[0]}
                </option>
              ))}
            </optgroup>
          ) : (
            <optgroup label="Consultant configs">
              {consultantConfigs.map((config: string) => (
                <option key={config} value={config}>
                  {config.split('/').pop().split('.yaml')[0]}
                </option>
              ))}
            </optgroup>
          )}
        </Select>
        <Button
          onClick={() => createDebate(selectedDebateType, selectedConfig)}
          className="ml-4"
        >
          New Debate
        </Button>
      </div>
    </div>
  );
}
