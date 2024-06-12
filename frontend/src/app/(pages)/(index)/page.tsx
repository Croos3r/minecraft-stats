"use client";

import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import Loader from "@/components/loader";
import { ResearchInput } from "@/components/research";
import ServerCard from "@/components/serveur/card";
import { FancyMultiSelect } from "@/components/ui/multi-select";
import { Category, Server, ServerStat } from "@/types/server";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

const Home = () => {
  const { data, error, isLoading } = useSWR<
    { server: Server; stat: ServerStat | null; categories: Category[] }[],
    Error
  >(`${process.env.NEXT_PUBLIC_API_URL}/servers`, fetcher, {
    refreshInterval: 1000 * 60 * 2,
  });

  const serversStats = useSWR<{totalRecords: number}>(`${process.env.NEXT_PUBLIC_API_URL}/website-stats`, fetcher, {
    refreshInterval: 1000 * 60 * 2,
  });

  const categories = useSWR<Category[], Error>(`${process.env.NEXT_PUBLIC_API_URL}/categories`, fetcher);

  const searchRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [serversToShow, setServersToShow] = useState<{ server: Server; stat: ServerStat | null; categories: Category[] }[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  useEffect(() => {
    if (data) {
      const filteredData = data?.filter(
        (server) =>
          server.server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          server.server.address.toLowerCase().includes(searchTerm.toLowerCase())
      ).filter((server) => {
        return selectedCategories.length === 0 || server.categories.some((category) => selectedCategories.includes(category.id.toString()));
      });

      const sortedData = filteredData?.toSorted((b, a) => {
        return (a.stat?.playerCount ?? 0) - (b.stat?.playerCount ?? 0);
      });

      setServersToShow(sortedData ?? []);
    }
  }, [data, searchTerm, selectedCategories]);

  return (
    <main className="w-full h-full flex flex-col flex-1 py-4 gap-4">
      {isLoading || categories.isLoading || serversStats.isLoading ? <Loader message="Loading..." /> : null}
      {error && <div>{error.message}</div>}
      {data && (
        <>
          <div className="bg-zinc-200 p-4 rounded-lg w-full flex gap-4">
            <ResearchInput placeholder="Search a server" ref={searchRef} onChange={handleSearchChange} />
            <FancyMultiSelect
              title="Filter by categories"
              elements={categories.data?.map((category) => ({ value: category.id.toString(), label: category.name })) ?? []}
              onSelectionChange={setSelectedCategories}
            />
          </div>
          <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 w-full truncate">
            {serversToShow.length > 0 ? (
              serversToShow.map((server) => (
                <ServerCard key={server.server.id} server={server.server} stat={server.stat} categories={server.categories} />
              ))
            ) : (
              <div className="w-full text-center md:col-span-2 lg:col-span-3">No servers found</div>
            )}
          </div>
          <div className="bg-zinc-200 p-4 rounded-md shadow-sm w-full flex flex-col sm:flex-row gap-2 justify-around">
            <div className="flex flex-row gap-2 items-center">
              <div>Nombre de connectés total</div>
              <div className="text-sm font-semibold">{data?.reduce((acc, curr) => acc + (curr.stat?.playerCount ?? 0), 0)}</div>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <div>Nombre de données</div>
              <div className="text-sm font-semibold">{serversStats.data?.totalRecords}</div>
            </div>
          </div>
        </>
      )}
    </main>
  );
};
export default Home;
