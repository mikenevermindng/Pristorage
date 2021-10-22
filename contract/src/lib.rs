use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen, setup_alloc};
use near_sdk::collections::{UnorderedMap};
use near_sdk::serde::{Serialize, Deserialize};
use std::option::Option::{Some, None};

setup_alloc!();

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct File {
    cid: String,
    name: String,
    encrypted_password: String,
    file_type: String
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Folder {
    id: String,
    name: String,
    files: Vec<String>,
    parent: String,
    children: Vec<String>,
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct SharedFolder {
    id: String,
    name: String,
    files: Vec<String>,
    parent: String,
    children: Vec<String>,
    folder_password: String,
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct User {
    public_key: String,
    encrypted_token: String
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct SharedFileDoc {
    share_with: String,
    owner: String,
    share_password: String
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct SharedFolderDoc {
    share_with: String,
    owner: String,
    share_password: String
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Contract {
    folders: UnorderedMap<String, Folder>,
    shared_folders: UnorderedMap<String, SharedFolder>,
    users: UnorderedMap<String, User>,
    files: UnorderedMap<String, File>,
}

impl Default for Contract {
    fn default() -> Self {
        Self {
            folders: UnorderedMap::new(b"f".to_vec()),
            shared_folders: UnorderedMap::new(b"sf".to_vec()),
            users: UnorderedMap::new(b"u".to_vec()),
            files: UnorderedMap::new(b"fl".to_vec())
        }
    }
}

#[near_bindgen]
impl Contract {

    pub fn sign_up(&mut self, public_key: String, encrypted_token: String) {
        env::log(format!("public_key : '{}', encrypted_token: {}", public_key, encrypted_token).as_bytes());
        let account_id = env::signer_account_id();
        let user = User {
            public_key: public_key,
            encrypted_token: encrypted_token
        };
        self.users.insert(&account_id, &user);
        let root = Folder {
            id: String::from(&account_id[..]),
            name: String::from("root"),
            files: Vec::new(),
            parent: String::from(&account_id[..]),
            children: Vec::new(),
        };
        let root_shared_folder = SharedFolder {
            id: String::from(&account_id[..]),
            name: String::from("root"),
            files: Vec::new(),
            parent: String::from(&account_id[..]),
            children: Vec::new(),
            folder_password: String::from("")
        };
        self.folders.insert(&String::from(&account_id[..]), &root);
        self.shared_folders.insert(&String::from(&account_id[..]), &root_shared_folder);
    }

    pub fn get_user(&self, account_id: String) -> Option<User> {
        env::log(format!("Account : '{}'", account_id).as_bytes());
        match self.users.get(&account_id) {
            Some(user) => Some(user),
            None => None
        }
    }

    pub fn create_folder(&mut self, _id: String, _name: String, _parent: String) {
        match self.folders.get(&_parent) {
            Some(mut folder) => {
                // assert_eq!(folder.root.to_string(), &account_id.to_string());
                folder.children.push(String::from(&_id[..]));
                self.folders.insert(&_parent, &folder);
                let new_folder = Folder {
                    id: String::from(&_id[..]),
                    name: String::from(&_name[..]),
                    files: Vec::new(),
                    parent: String::from(&_parent[..]),
                    children: Vec::new(),
                };
                self.folders.insert(&_id, &new_folder);
            },
            None => {
                env::log(format!("Folder not found: '{}'", _parent).as_bytes());
            }
        };
    }

    pub fn create_shared_folder(&mut self, _id: String, _name: String, _parent: String, _password: String) {
        match self.shared_folders.get(&_parent) {
            Some(mut folder) => {
                // assert_eq!(folder.root.to_string(), &account_id.to_string());
                folder.children.push(String::from(&_id[..]));
                self.shared_folders.insert(&_parent, &folder);
                let new_folder = SharedFolder {
                    id: String::from(&_id[..]),
                    name: String::from(&_name[..]),
                    files: Vec::new(),
                    parent: String::from(&_parent[..]),
                    children: Vec::new(),
                    folder_password: String::from(&_password[..]),
                };
                self.shared_folders.insert(&_id, &new_folder);
            },
            None => {
                env::log(format!("Folder not found: '{}'", _parent).as_bytes());
            }
        };
    }

    pub fn create_file(&mut self, _folder: String, _file_id: String, _cid: String, _name: String, _encrypted_password: String, _file_type: String) {
        match self.folders.get(&_folder) {
            Some(mut folder) => {
                // assert_eq!(folder.root.to_string(), &account_id.to_string());
                let file = File {
                    cid: _cid,
                    name: _name,
                    encrypted_password: _encrypted_password,
                    file_type: _file_type
                };
                folder.files.push(String::from(&_file_id[..]));
                self.folders.insert(&_folder, &folder);
                self.files.insert(&_file_id, &file);
            },
            None => {
                env::log(format!("Folder not found: '{}'", _folder).as_bytes());
            }
        };
    }

    pub fn create_shared_folder_file(&mut self, _folder: String, _file_id: String, _cid: String, _name: String, _file_type: String) {
        match self.shared_folders.get(&_folder) {
            Some(mut folder) => {
                // assert_eq!(folder.root.to_string(), &account_id.to_string());
                let file = File {
                    cid: _cid,
                    name: _name,
                    encrypted_password: String::from(""),
                    file_type: _file_type
                };
                folder.files.push(String::from(&_file_id[..]));
                self.shared_folders.insert(&_folder, &folder);
                self.files.insert(&_file_id, &file);
            },
            None => {
                env::log(format!("Folder not found: '{}'", _folder).as_bytes());
            }
        };
    }

    pub fn remove_file(&mut self, _folder: String, _file: String) {
        match self.folders.get(&_folder) {
            Some(mut folder) => {
                // assert_eq!(folder.root.to_string(), &account_id.to_string());
                let index = folder.files.iter().position(|x| *x == _file).unwrap();
                folder.files.remove(index);
                self.folders.insert(&_folder, &folder);
                self.files.remove(&_file);
            },
            None => {
                env::log(format!("Folder not found: '{}'", _folder).as_bytes());
            }
        };
    }

    pub fn remove_folder(&self, folder_id: String) {
        match self.folders.get(&folder_id) {
            Some(mut folder) => {
                // assert_eq!(folder.root.to_string(), &account_id.to_string());
                let index = folder.children.iter().position(|x| *x == folder_id).unwrap();
                folder.children.remove(index);
            },
            None => {
                env::log(format!("Folder not found: '{}'", folder_id).as_bytes());
            }
        };
    }

    pub fn get_file_info(&self, file_id: String) -> Option<File> {
        match self.files.get(&file_id) {
            Some(file) => Some(file),
            None => None,
        }
    }

    pub fn get_root_shared_folder(&self, _parent: String) -> Option<SharedFolder> {
        let account_id = env::signer_account_id();
        env::log(format!("Account : '{}'", account_id).as_bytes());
        let mut parent_id = String::from(&_parent[..]);
        let mut root_id = String::from("");
        while parent_id.eq(&account_id) {
            match self.shared_folders.get(&parent_id) {
                Some(folder) => {
                    parent_id = folder.parent;
                    root_id = folder.id;
                },
                None => {},
            };
        };
        let result = match self.shared_folders.get(&root_id) {
            Some(folder) => Some(folder),
            None => None,
        };
        result
    }

    pub fn get_folder_info(&self, folder_id: String) -> Option<Folder> {
        match self.folders.get(&folder_id) {
            Some(folder) => Some(folder),
            None => None,
        }
    }

    pub fn get_shared_folder_info(&self, folder_id: String) -> Option<SharedFolder> {
        match self.shared_folders.get(&folder_id) {
            Some(folder) => Some(folder),
            None => None,
        }
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::MockedBlockchain;
    use near_sdk::{testing_env, VMContext};

    // mock the context for testing, notice "signer_account_id" that was accessed above from env::
    fn get_context(input: Vec<u8>, is_view: bool) -> VMContext {
        VMContext {
            current_account_id: "alice_near".to_string(),
            signer_account_id: "bob_near".to_string(),
            signer_account_pk: vec![0, 1, 2],
            predecessor_account_id: "carol_near".to_string(),
            input,
            block_index: 0,
            block_timestamp: 0,
            account_balance: 0,
            account_locked_balance: 0,
            storage_usage: 0,
            attached_deposit: 0,
            prepaid_gas: 10u64.pow(18),
            random_seed: vec![0, 1, 2],
            is_view,
            output_data_receivers: vec![],
            epoch_height: 19,
        }
    }

    #[test]
    fn set_then_get_greeting() {
        let context = get_context(vec![], false);
        testing_env!(context);
        let mut contract = Contract::default();
        // contract.set_greeting("howdy".to_string());
        // assert_eq!(
        //     "howdy".to_string(),
        //     contract.get_greeting("bob_near".to_string())
        // );
    }

    #[test]
    fn get_default_greeting() {
        let context = get_context(vec![], true);
        testing_env!(context);
        let contract = Contract::default();
        // this test did not call set_greeting so should return the default "Hello" greeting
        // assert_eq!(
        //     "Hello".to_string(),
        //     contract.get_greeting("francis.near".to_string())
        // );
    }
}
