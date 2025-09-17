import { AreaChart } from "@mantine/charts";
import { Flex } from "@mantine/core";
import { IProcess } from "@pm2.web/typings";

import { formatBytes } from "@/utils/format";
import { trpc } from "@/utils/trpc";

interface ProcessClusterChartProps {
  processes: IProcess[];
  refetchInterval: number;
  showMetric: boolean;
  polling: number;
}

export default function ProcessClusterChart({ processes, refetchInterval, showMetric, polling }: ProcessClusterChartProps) {
  // Get online processes only
  const onlineProcesses = processes.filter(p => p.status === "online");
  const processIds = onlineProcesses.map(p => p._id);
  const serverIds = [...new Set(onlineProcesses.map(p => p.server.toString()))];

  const getStats = trpc.server.getStats.useQuery(
    {
      processIds,
      serverIds,
      polling,
    },
    {
      refetchInterval,
      enabled: showMetric && processIds.length > 0,
    },
  );

  const chartData =
    getStats?.data?.stats
      ?.map((s) => ({
        CPU: s.processCpu * onlineProcesses.length, // Multiply by number of processes to get cumulative
        RAM: s.processRam * onlineProcesses.length, // Multiply by number of processes to get cumulative
        date: new Date(s._id).toLocaleTimeString(),
      }))
      ?.reverse() || [];

  if (!showMetric || processIds.length === 0) {
    return null;
  }

  return (
    <Flex align={"center"} justify={"space-between"}>
      <AreaChart
        w={"50%"}
        h={"150px"}
        pt={"0.5em"}
        pr="xs"
        data={chartData}
        valueFormatter={(value) => formatBytes(value)}
        dataKey="date"
        type="default"
        series={[
          { name: "RAM", color: "yellow" },
        ]}
        withLegend
        withGradient
        withDots={false}
        withXAxis={false}
        areaChartProps={{ syncId: "cluster-stats" }}
      />
      <AreaChart
        w={"50%"}
        h={"150px"}
        pt={"0.5em"}
        pr="xs"
        data={chartData}
        dataKey="date"
        type="default"
        yAxisProps={{ domain: [0, 100 * onlineProcesses.length] }} // Scale based on number of processes
        series={[{ name: "CPU", color: "indigo.6" }]}
        withLegend
        withGradient
        withDots={false}
        withXAxis={false}
        areaChartProps={{ syncId: "cluster-stats" }}
      />
    </Flex>
  );
}
