import { ethers } from "ethers";
import { useEffect, useState } from "react";
import deploy from "./deploy";
import Escrow from "./Escrow";

const provider = new ethers.providers.Web3Provider(window.ethereum);

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();
  const [errorMsg, setErrorMsg] = useState();

  async function approve(escrowContract, signer) {
    try {
      const approveTxn = await escrowContract.connect(signer).approve();
      await approveTxn.wait();
      setErrorMsg("");
    } catch (err) {
      console.log("Error approving: ", err);
      setErrorMsg(err.message);
    }
  }

  useEffect(() => {
    async function getAccounts() {
      try {
        const accounts = await provider.send("eth_requestAccounts", []);

        setAccount(accounts[0]);
        setSigner(provider.getSigner());

        getAccounts();

        setErrorMsg("");
      } catch (err) {
        setErrorMsg(err.message);
      }
    }
  }, [account]);

  async function newContract() {
    try {
      const beneficiary = document.getElementById("beneficiary").value;
      const arbiter = document.getElementById("arbiter").value;
      const value = ethers.BigNumber.from(document.getElementById("wei").value);
      const escrowContract = await deploy(signer, arbiter, beneficiary, value);

      const escrow = {
        address: escrowContract.address,
        arbiter,
        beneficiary,
        value: value.toString(),
        handleApprove: async () => {
          escrowContract.on("Approved", () => {
            document.getElementById(escrowContract.address).className =
              "complete";
            document.getElementById(escrowContract.address).innerText =
              "✓ It's been approved!";
          });

          await approve(escrowContract, signer);
        },
      };

      setErrorMsg("");

      setEscrows([...escrows, escrow]);
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  return (
    <>
      <p>{errorMsg}</p>
      <div className="contract">
        <h1> New Contract </h1>
        <label>
          Arbiter Address
          <input type="text" id="arbiter" />
        </label>

        <label>
          Beneficiary Address
          <input type="text" id="beneficiary" />
        </label>

        <label>
          Deposit Amount (in Wei)
          <input type="text" id="wei" />
        </label>

        <div
          className="button"
          id="deploy"
          onClick={(e) => {
            e.preventDefault();

            newContract();
          }}
        >
          Deploy
        </div>
      </div>

      <div className="existing-contracts">
        <h1> Existing Contracts </h1>

        <div id="container">
          {escrows.map((escrow) => {
            return <Escrow key={escrow.address} {...escrow} />;
          })}
        </div>
      </div>
    </>
  );
}

export default App;
