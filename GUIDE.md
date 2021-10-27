Vi storage
==================

PriStorage is an application for users who want to store their files in private, which demands a simple application for users to encrypt and manage files stored on Ipfs or Filecoin network using Web3Storage service.This application uses Web3 Storage service for storing file and Near smart contract to manage these files.



Requirement
===========
To use this application, you need to:
1. Create a near wallet account
2. Sign up Web3.Storage service



Quick Start
===========
1. ### Sign up
    Go to [https://manhnvan.github.io/decentralize_file_store_app/](https://manhnvan.github.io/decentralize_file_store_app/) and click to the login button
    The app will redirect to Near wallet [https://wallet.testnet.near.org/](https://wallet.testnet.near.org/) and then allow the app to access wallet (cause this app is now under development so we have just deploy on testnet).
    Go to [https://web3.storage/](https://web3.storage/) and login with your account and copy your Web3.Storage token.
    Comeback the page and paste copied token into the form, wait for the SeedPhrase file is downloaded (this file named as {your_near_wallet_account_id}_SeedPhrase.txt), you are now logged in.
    Make sure you store the SeedPhrase file carefully because it would be used to login your account and used to generate your rsa key pair.

2. ### Sign in
    Go to [https://manhnvan.github.io/decentralize_file_store_app/](https://manhnvan.github.io/decentralize_file_store_app/), if you have not logged in on this browser, you have to provide the SeedPhrase store in the SeedPhrase file downloaded when you signed up with.
    If the SeedPhrase is correct, you are now logged in.

3. ### Create folder in "My Folders" tab
    Click on "Create folder" button and enter the folder name you, then click "Ok", This app will call a function which stores a json document on the near network for managing the folder.
    The app will redirect to the Near wallet.
    Click on "Allow" button, if the transaction is successful, your folder is created.
    You can go to a folder and create a subfolder in this way too.

4. ### Create folder in "Shared Folders" tab
    Click on "Create folder" button and enter the folder name you, then click "Ok", This app will call a function which stores a json document (which has an attribute is folder_password - encrypted by the key pair and use to encrypt all the files in this folder or its subfolder) on the near network for managing the folder.
    The app will redirect to the Near wallet.
    Click on "Allow" button, if the transaction is successful, your folder is created.
    You can go to a folder and create a subfolder in this way too.

5. ### Upload a file in "My Folders" tab
    You need to make sure that you are accessing a folder to show the "Upload file" button.
    Click on "Upload file" and click or drop you file into the dropzone. This app will create a password randomly, then the file will be encrypted by the password and the password will be encrypted by the key pair. After the process, this app will call a function which stores file on IPFS/Filecoin and stores a json document on the near network for managing the file.
    The app will redirect to the Near wallet.
    Click on "Allow" button, if the transaction is successful, your file is uploaded.

5. ### Upload a file in "Shared Folders" tab
    You need to make sure that you are accessing a folder to show the "Upload file" button.
    Click on "Upload file" and click or drop you file into the dropzone. This app find the root folder of the file (the root folder contain the file) and get its folder_password, then the file will be encrypted by the folder_password. After the process, this app will call a function which stores file on IPFS/Filecoin and stores a json document on the near network for managing the file.
    The app will redirect to the Near wallet.
    Click on "Allow" button, if the transaction is successful, your file is uploaded.

6. ### Share a file or folder in "My folders" tab and "Shared folders"
    Click on the share button of file/folder, then enter the account id of the user you wanna to share it with.
    Allow the transaction on near wallet (like the previous section), if the transaction is successful, the file/folder will render in the tab "Files Shared With Me" (if you shared file) or "Folders Shared With Me" (if you shared file).
    Note: In the "My Folders" tab, you only share a single file, on the other hand, the "Shared Folders" tab allow you to share whole shared folder (the folder in root directory) but you cannot share the subfolder or the file in the shared folder.

7. ### Download file
    Click on the download button of file and wait for app decrypt the file and download it if the encrypt process is successful.

8. ### Delete file/folder
    Click on the delete button of file/folder and allow the incoming transaction, if the transaction is successful, your file/folder is deleted.
    Note: the file is note completely remove on Web3.Storage server the because the Web3.Storage did not provide an api for delete file, we just remove documents contain file's information

9. ### Get shared file/folder with your own
    Go to the tab "Files shared with me" to get the single files shared from other users shared to you
    Go to the tab "Folders shared with me" to get the single files shared from other users shared to you
