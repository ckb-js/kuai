# User Stories of the Second demo:Support WalletConnect

## Background

With the development of the WalletConnect Protocol, users can be able to connect a dapp directly to a wallet.

Kuai project has implemented connection with metamask , could be improved to support the new feature, that is WalletConnect. To do so, we improve the second demo of kuai project. It will show the dapp which kuai will help developers to build and help users to connect to their wallets.

## Abstract

This documentation describes the product requirements of the second demo of kuai project.

The second demo of Kuai is a sudt dapp which allows a Token Minter to mint/manage token and Holders to transfer token.

> Notes: The requirements mentioned here are for some specific requirements general and easy to understand. Developers can adjust/modify/rewrite the whole implementation once they understand the framework of kuai.

## Documentation

### Rules
- The SUDT tool allows users create SUDT using both MetaMask or other wallets which supports CKB WalletConnect RFC.
- One address is supposed to be used to generate the SUDT only once.
- While connecting to an Account by WalletConnect, when the users want to generate SUDT , this app will automaticly pick up the addresses which are never used before to generate the SUDT. If none, users will not be able to generate but only manage them.
- This account is also the MINTER of the token, and the only account that can mint more tokens. 
### Flows

#### Login
Users need to connect to the site by Metamask or WalletConnect in order to log in and use this SUDT management tool.

![pic 0](pic/ConnectWallet.png)     

You can choose either to connect by Metamask or by WalletConnet

For Metamask:
1. Click the "Connect to Metamask" button on the login page;
2. Click "Next" and "Connect" Button on Metamask popup window;
3. The current metamask account will be connected to this site automatically.

For WalletConnet:
1. Click the "Connect by WalletConnect" button on the login page;
2. Scan the QR Code on previous page within your wallet.
3. Go on accomplish the connect process on your wallet.

> By default, the users will be connected to testnet, so there will be a Faucet link for them. New users who never create SUDT will be provided with the Create method; on the other hand, users who created SUDT will be provided with the Manage method.

> After connecting the testnet at firt time , for a new account, the CKB balance will mostly be 0. Then a window will pop up to help claim Test CKB.

First login with an brand new account on testnet, users may see this:

There will be a faucet icon for user to claim test CKB just like the current website do.
Also if the user’s CKB balance is lower than 100CKB , a window will pop up to help him/her to get test CKB.

![pic 2](pic/FirstLogin.png)  

#### Root Page

After logging in, the user can check his assets.

![pic 3](pic/RootPage.png)  


There are several parts in this page:


1. Account display: This shows the account id that user has connected to this site. Click the account id , a pop-up will show him the whole connected addresses.
2. Disconnect button: Click to disconnect current account, and back to home page.
3. CKB balance: show the sum of CKB balance of the connected ckb addresses. This value should update as quick as it can be.
4. CKB network : Show the network the user is going to work on.
5. Function Part: Privide 3 different functions that user can do with SUDT. And the 3rd function will change based on to which account current wallet is connectting.
6. Asset Tab: The defaut tab where users can view his ckb and SUDT balance of this connected account.
7. Tokens Tab: A Token List where display all the SUDT creadted by all users and of course the token minted by current user will display on the top.
8. History Tab: Users can check all their transaction history of the current account.

User Functions of these parts.
- Check Addresses List
  ![pic 5](pic/CheckAddressesList.png)  
- Disconnect button: Users can disconnect or swicth account using the Disconnect button.
- Switch CKB network: Users can click switch icon to shift the CKB network they are going to work on.
![pic 4](pic/SwitchNetwork.png)  
- Choose to send/receive/create/manage SUDT


##### Asset Tab

![pic 6](pic/AssetTab.png)  



Asset Tab shows all the tokens and assets the address contain.
- CKB balance will show on the top of this list.
- Asset Tab automaticly find the specific SUDTs if current connected addresses have ever mint, and show them behind CKB.
- Asset Tab automaticly search any other assets belongs to the connected addresses, and show its balance based on the SUDT's decimal. These SUDT will be sort by the balance descendingly.
- Click the token line, then the page jump to the Token details.
##### Tokens Tab

Tokens Tab shows almost all the SUDT tokens in this case.Tokens tab here are subject to a whitelist. Only SUDTs created through this demo will be displayed under the Token tab list.

![pic 8](pic/TokenTab.png)  


1. Users need to turn on the Token detector to abtain all the SUDT tokens in this case.
2. User can turn off the Token detector as well.
3. The SUDT creator can view the token Info/view the Distribution/modify/mint Token.See more on Manage User created SUDT below.
4. User can view the Token Info or the Token distribution of all detected Tokens.

![pic 10](pic/TokenInfoNDistribution.png)  


Other Functions:
- Click the outlink icon will lead to the CKB explorer


##### History Tab

The historu tab show all transaction of current address including the pending transaction.


![pic 11](pic/HistoryTab.png)  


- TXID

  The theme color highlights the TXID (transaction hash), which can be clicked to navigate to the transaction details page on the blockchain explorer.
- From/To/Mint

  For the user's address in this transaction, the SUDT balance will be displayed as increased under "From" and decreased under "To". Specially, If the transaction is a mint transaction which means the out put SUDT amount is bigger than the input SUDT.
- From/To Address*

  The To address is marked with an underline, and clicking on it will navigate to the address details page on the blockchain explorer.

  [Note] In a typical CKB UTXO transaction, there may be more than one From address and To address. However, in this demo, the input/output address count is limited (with the change address being the same as the To address), so there is only one From address and a single output address other than the From address.

  [Enhanced Compatibility] If the transaction has two or more From addresses or three or more To addresses, the number of these addresses will be marked behind the From/To addresses.

- SUDT Amount Change

  The SUDT balance for the user addresses changes after this transaction.

> If possible, the mint transaction and the modification transaction should be also tag or in the hover bubble.

#### Initialize and distribute SUDT 

A new account usually dont have any other assets beyond CKB.
Thus user can create his own SUDT here. And distribute the SUDT to a list of addresses.

![pic 11](pic/CreateToken.png)  


1. Click the create button on homepage
2. Fill the form which is necessary to create a SUDT.
3. Click create button and sign the transaction on wallet side to create the SUDT

> *While creating the SUDT, Users can mint the token to several address

#### Send tokens

![pic 13](pic/SendTokens.png)  
![pic 12](pic/SendTokens.png)  


There are two ways to get into the SUDT Transfer page.

1. Go to the SUDT page and use the send function
2. Click the Send button on Root page, then select the right SUDT in TOKENS field.

> Bulk sending tokens could also be a useful function if possible.

#### Receive tokens

Click the receive button on Root Page or any token page will lead to the receiving Page.
Copy the CKB address , and send it to Sender to promote the transaction.

![pic 13](pic/ReceiveSUDT.png)  



#### Manage User created SUDT

Token creater could manage the SUDT created by him/her for 2 ways:
1. Modify the token information
2. Mint more token to an address

![pic 15](pic/ManageToken.png)  

 
 

- Modify the token information
  
  Clicking Modify Info button on Manage Page or Tokens Tab on Root Page will lead to the information page. Modify the information and then click Confirm button.

- Mint more token to an address

  Clicking Mint Button lead to the mint page.

##### About Manage Page

![pic 17](pic/ManagePage.png)  


The Manage Page consists of 2 part: 
- SUDT pannel: User could view token info/ view token distribution/modify/mint his SUDT
- SUDT Token history: shows all confirmed Transaction of this SUDT.
  1. Tx ID: The Transaction ID. Click to jump to explorer.
  2. From/To addresses: If multiple addresses are related in one transaction, they all will be displayed.
  3. Time zone: If this tx is finished, then it will be the onchain time, if it's still pending, then it just show "Pending"
  4. Amount: the amount of SUDT From Addresses sent to To Addresses.
