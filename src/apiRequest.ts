export const fetchUser = (query: string): Promise<Array<User>> =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      console.log("timee");
      if (query.toLowerCase() === "unknown") {
        return resolve([]);
      }

      if (query.toLowerCase() === "error") {
        return reject();
      }

      resolve([
        { username: `${query} Chaplinsson`, id: "1" },
        { username: `${query} Håkansson`, id: "2" },
        { username: `${query} Testingsson`, id: "3" },
      ]);
    }, 400)
  );

interface User {
  username: string;
  id: string;
}
