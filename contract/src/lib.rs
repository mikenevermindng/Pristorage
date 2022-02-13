use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen, setup_alloc};
use near_sdk::collections::{UnorderedMap, UnorderedSet};
use std::option::Option::{Some, None};
use near_sdk::serde::{Serialize, Deserialize};

setup_alloc!();

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct File {
    cid: String,
    name: String,
    encrypted_password: Option<String>,
    file_type: String, // type of file (png, jpeg)
    last_update: u64,
    updated_by: String,
    created_at: u64,
    created_by: String
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Folder {
    name: String,
    files: Vec<String>,
    parent: String,
    children: Vec<String>,
    created_at: u64
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct SharedFolder {
    name: String,
    files: Vec<String>,
    parent: String,
    children: Vec<String>,
    folder_password: Option<String>,
    created_by: String,
    created_at: u64
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct FolderV2 {
    name: String,
    files: Vec<String>,
    parent: String,
    children: Vec<String>,
    folder_type: Option<u8>, // 1 for common folder, 2 for shared folder
    folder_password: Option<String>,
    created_by: String,
    created_at: u64,
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
    file: String,
    share_password: String,
    permissions: u8,
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct SharedFolderDoc {
    folder: String,
    share_password: String,
    permissions: u8,
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct SharedDoc {
    doc_id: String,
    share_password: String,
    permissions: u8,
    created_at: u64,
    doc_type: u8 // 1 for file, 2 for folder
}

#[near_bindgen]
#[derive(BorshSerialize, BorshDeserialize)]
pub struct Contract {

    // v2 developing
    folders_v2:  UnorderedMap<String, FolderV2>,
    users: UnorderedMap<String, User>,
    files: UnorderedMap<String, File>,
    shared_docs: UnorderedMap<String, SharedDoc>,
    shared_docs_of_user: UnorderedMap<String, UnorderedSet<String>>, // mapping from user to a mapping user => doc which the user own



    // v1
    folders: UnorderedMap<String, Folder>,
    shared_folders: UnorderedMap<String, SharedFolder>,
    
    shared_file_docs: UnorderedMap<String, SharedFileDoc>,
    shared_folder_docs: UnorderedMap<String, SharedFolderDoc>,

    shared_file_to_user: UnorderedMap<String, UnorderedSet<String>>,
    user_to_shared_file: UnorderedMap<String, UnorderedMap<String, UnorderedSet<String>>>,

    shared_folder_to_user: UnorderedMap<String, UnorderedSet<String>>,
    user_to_shared_folder: UnorderedMap<String, UnorderedMap<String, UnorderedSet<String>>>,
}

impl Default for Contract {
    fn default() -> Self {
        Self {
            folders: UnorderedMap::new(b"f".to_vec()),
            shared_folders: UnorderedMap::new(b"sf".to_vec()),
            folders_v2: UnorderedMap::new(b"fv2".to_vec()),
            users: UnorderedMap::new(b"u".to_vec()),
            files: UnorderedMap::new(b"fl".to_vec()),
            shared_docs: UnorderedMap::new(b"fd".to_vec()),
            shared_docs_of_user: UnorderedMap::new(b"sdou".to_vec()),

            shared_file_docs: UnorderedMap::new(b"sfld".to_vec()),
            shared_folder_docs:UnorderedMap::new(b"sfdd".to_vec()),

            shared_file_to_user: UnorderedMap::new(b"sfltu".to_vec()),
            user_to_shared_file: UnorderedMap::new(b"utsfl".to_vec()),

            shared_folder_to_user: UnorderedMap::new(b"sfdtu".to_vec()),
            user_to_shared_folder: UnorderedMap::new(b"utsfd".to_vec())
        }
    }
}

#[near_bindgen]
impl Contract {

    pub fn sign_up(&mut self, _public_key: String, _encrypted_token: String, _created_at: u64) {
        env::log(format!("public_key : '{}', encrypted_token: {}", _public_key, _encrypted_token).as_bytes());
        let account_id = env::signer_account_id();
        let user = User {
            public_key: _public_key,
            encrypted_token: _encrypted_token
        };
        self.users.insert(&account_id, &user);
        let root = Folder {
            name: String::from("root"),
            files: Vec::new(),
            parent: String::from(&account_id[..]),
            children: Vec::new(),
            created_at: _created_at
        };
        let root_shared_folder = SharedFolder {
            name: String::from("root"),
            files: Vec::new(),
            parent: String::from(&account_id[..]),
            children: Vec::new(),
            folder_password: None,
            created_by: String::from(&account_id[..]),
            created_at: _created_at
        };
        let root_shared_folder_v2 = FolderV2 {
            name: String::from("root"),
            files: Vec::new(),
            parent: String::from(&account_id[..]),
            children: Vec::new(),
            folder_password: None,
            created_by: String::from(&account_id[..]),
            created_at: _created_at,
            folder_type: None,
        };
        self.folders.insert(&String::from(&account_id[..]), &root);
        self.shared_folders.insert(&String::from(&account_id[..]), &root_shared_folder);
        self.folders_v2.insert(&String::from(&account_id[..]), &root_shared_folder_v2);
    }

    pub fn get_user(&self, account_id: String) -> Option<User> {
        env::log(format!("Account : '{}'", account_id).as_bytes());
        match self.users.get(&account_id) {
            Some(user) => Some(user),
            None => None
        }
    }

    pub fn verify_accessible(
        &self, 
        root_folder: &Option<FolderV2>, 
        folder_id: String,
        account_id: String,
    ) {
        match root_folder {
            Some(folder) => {
                let owner = &folder.parent;
                let root_folder_id = folder_id;
                let share_doc_id = format!("{}_{}_{}", owner, account_id, root_folder_id);
                if !owner.eq(&account_id) {
                    match self.shared_docs.get(&share_doc_id) {
                        Some(share_doc) => {
                            assert_eq!(
                                share_doc.permissions,
                                2,
                                "You do not have permission to change this folder {}",
                                share_doc_id
                            );
                        },
                        None => {
                            assert!(
                                false, 
                                "You do not shared with this doc {}",
                                share_doc_id
                            );
                        }
                    }
                }
            },
            None => {
                assert!(false, "You do not have permission to change this folder"); 
            }
        }
    }

    pub fn validate_folder_id(&self, _folder_id: String) {
        match self.users.get(&String::from(&_folder_id[..])) {
            Some(_) => {
                assert!(false, "Invalid folder id"); 
            },
            None => {}
        }
        match self.folders_v2.get(&_folder_id) {
            Some(_) => {
                assert!(false, "Folder id already exists"); 
            },
            None => {}
        }
    }

    pub fn verify_user(&self ,account_id: String, owner_id: String) {
        assert_eq!(
            account_id,
            owner_id,
            "Owner not match: '{}', '{}'", account_id, String::from(&owner_id[..])
        );
    }

    pub fn validate_file_id(&self, _file_id: String) {
        match self.files.get(&_file_id) {
            Some(_) => {
                assert!(false, "file id already exists"); 
            },
            None => {}
        }
    }

    pub fn validate_folder_type(&self, root_folder: &Option<FolderV2>, folder_type: u8) {
        match root_folder {
            Some(root_folder_parsed) => {
                if root_folder_parsed.folder_type.is_some() {
                    assert_eq!(
                        root_folder_parsed.folder_type.unwrap(), 
                        folder_type, 
                        "bad behavior"
                    );
                } else {
                    assert!(false, "root folder not found")
                }
            },
            None => {
                assert!(false, "root folder not found")
            }
        }
    }

    pub fn create_folder_v2(
        &mut self, 
        _id: String, 
        _name: String, 
        _parent: String, 
        _password: Option<String>, 
        _type: Option<u8>, 
        _created_at: u64
    ) {
        self.validate_folder_id(String::from(&_id));
        let _account_id = env::signer_account_id();
        if _parent.ne(&_account_id) {
            let (root_folder, folder_id) = self.get_root(String::from(&_parent[..]));
            self.verify_accessible(&root_folder, folder_id, String::from(&_account_id[..]));
        }
        let mut folder_password = None;
        let mut folder_type = None;
        if _parent.eq(&_account_id) && _type.is_some() {
            if  _type.unwrap() == 2 {
                folder_password = _password;
            }
            folder_type = _type
        }
        let _parent_id: &str = _parent.as_str();
        match self.folders_v2.get(&_parent) {
            Some(mut folder) => {
                folder.children.push(String::from(&_id[..]));
                self.folders_v2.insert(&_parent, &folder);
                let new_folder = FolderV2 {
                    name: String::from(&_name[..]),
                    files: Vec::new(),
                    parent: String::from(&_parent[..]),
                    children: Vec::new(),
                    folder_password: folder_password,
                    folder_type: folder_type,
                    created_by: _account_id,
                    created_at: _created_at
                };
                self.folders_v2.insert(&_id, &new_folder);
            },
            None => {
                env::log(format!("Folder not found: '{}'", _parent).as_bytes());
            }
        };
    }

    pub fn create_file_v2(
        &mut self, 
        _folder: String, 
        _file_id: String, 
        _cid: String, 
        _name: String, 
        _encrypted_password: Option<String>, 
        _file_type: String, 
        _created_at: u64
    ) {
        self.validate_file_id(String::from(&_file_id[..]));
        let _account_id = env::signer_account_id();
        let (root_folder, folder_id) = self.get_root(String::from(&_folder[..]));
        self.verify_accessible(&root_folder, folder_id, String::from(&_account_id[..]));
        match self.folders_v2.get(&_folder) {
            Some(mut folder) => {
                let file = File {
                    cid: _cid,
                    name: _name,
                    encrypted_password: _encrypted_password,
                    file_type: _file_type,
                    created_at: _created_at,
                    created_by: String::from(&_account_id[..]),
                    updated_by: _account_id,
                    last_update: _created_at,
                };
                let index = folder.files.iter().position(|x| *x == _file_id);
                if index.is_none() {
                    folder.files.push(String::from(&_file_id[..]));
                }
                self.folders_v2.insert(&_folder, &folder);
                self.files.insert(&_file_id, &file);
            },
            None => {
                env::log(format!("Folder not found: '{}'", _folder).as_bytes());
            }
        };
    }

    pub fn share_file_v2(
        &mut self, 
        _file_id: String, 
        _share_with: String, 
        _parent_folder: String, 
        _password: String,
        _permissions: u8,
        _created_at: u64
    ) {
        let _account_id = env::signer_account_id();
        assert_ne!(
            String::from(&_account_id[..]), 
            String::from(&_share_with[..]), 
            "cannot share to your self {} - {}", &_account_id, &_share_with
        );
        let (root_folder, folder_id) = self.get_root(String::from(&_parent_folder[..]));
        
        self.verify_accessible(&root_folder, folder_id, String::from(&_account_id[..]));
        self.validate_folder_type(&root_folder, 1);
        match self.folders_v2.get(&_parent_folder) {
            Some(folder) => {
                let index = folder.files.iter().position(|f| String::from(&f[..]).eq(&_file_id[..]));
                assert_eq!(
                    index.is_none(), 
                    false, 
                    "file {} not in folder {}", _file_id, _parent_folder
                );
            },
            None => {
                env::log(format!("Folder not found: '{}'", _parent_folder).as_bytes());
            }
        }
        let share_doc_id = format!("{}_{}_{}", _account_id, _share_with, _file_id);
        let share_doc = SharedDoc {
            doc_id: _file_id,
            share_password: _password,
            permissions: _permissions,
            created_at: _created_at,
            doc_type: 1
        };
        self.shared_docs.insert(&share_doc_id, &share_doc);
        match self.shared_docs_of_user.get(&_share_with) {
            Some(mut user_shared_with_docs) => {
                user_shared_with_docs.insert(&share_doc_id);
                self.shared_docs_of_user.insert(&_share_with ,&user_shared_with_docs);
            },
            None => {
                let mut files_prefix = Vec::with_capacity(33);
                files_prefix.push(b's');
                files_prefix.extend(env::sha256(_account_id.as_bytes()));
                let mut new_shared_set = UnorderedSet::new(files_prefix.to_vec());
                new_shared_set.insert(&share_doc_id);
                self.shared_docs_of_user.insert(&_share_with ,&new_shared_set);
            }
        }
    }

    pub fn share_folder_v2(
        &mut self, 
        _folder_id: String, 
        _share_with: String, 
        _password: String,
        _permissions: u8,
        _created_at: u64,
    ) {
        let _account_id = env::signer_account_id();
        assert_ne!(
            String::from(&_account_id[..]), 
            String::from(&_share_with[..]), 
            "cannot share to your self"
        );
        let (root_folder, root_folder_id) = self.get_root(String::from(&_folder_id[..]));
        assert_eq!(
            String::from(&root_folder_id[..]), 
            String::from(&_folder_id[..]), 
            "this is not the root folder"
        );
        self.verify_accessible(&root_folder, root_folder_id, String::from(&_account_id[..]));
        self.validate_folder_type(&root_folder, 2);
        let share_doc_id = format!("{}_{}_{}", _account_id, _share_with, _folder_id);
        let share_doc = SharedDoc {
            doc_id: _folder_id,
            share_password: _password,
            permissions: _permissions,
            created_at: _created_at,
            doc_type: 2
        };
        self.shared_docs.insert(&share_doc_id, &share_doc);
        match self.shared_docs_of_user.get(&_share_with) {
            Some(mut user_shared_with_docs) => {
                user_shared_with_docs.insert(&share_doc_id);
                self.shared_docs_of_user.insert(&_share_with ,&user_shared_with_docs);
            },
            None => {
                let mut files_prefix = Vec::with_capacity(33);
                files_prefix.push(b's');
                files_prefix.extend(env::sha256(_account_id.as_bytes()));
                let mut new_shared_set = UnorderedSet::new(files_prefix.to_vec());
                new_shared_set.insert(&share_doc_id);
                self.shared_docs_of_user.insert(&_share_with ,&new_shared_set);
            }
        }
    }

    pub fn remove_file_v2(&mut self, _folder: String, _file: String) {
        let _account_id = env::signer_account_id();
        let (root_folder, _) = self.get_root(String::from(&_folder[..]));
        match root_folder {
            Some(root_folder_unwrapped) => {
                let owner_id = root_folder_unwrapped.parent;
                self.verify_user(_account_id, owner_id);
            },
            None => {
                assert!(false, "root folder not found")
            }
        }
        match self.folders_v2.get(&_folder) {
            Some(mut folder) => {
                let index = folder.files.iter().position(|x| *x == _file).unwrap();
                folder.files.remove(index);
                self.folders_v2.insert(&_folder, &folder);
                self.files.remove(&_file);
            },
            None => {
                env::log(format!("Folder not found: '{}'", _folder).as_bytes());
            }
        }
    }

    pub fn remove_folder_v2(&mut self, _folder: String) {
        let _account_id = env::signer_account_id();
        let (root_folder, _) = self.get_root(String::from(&_folder[..]));
        match root_folder {
            Some(root_folder_unwrapped) => {
                let owner_id = root_folder_unwrapped.parent;
                self.verify_user(_account_id, owner_id);
            },
            None => {
                assert!(false, "root folder not found")
            }
        }
        match self.folders_v2.get(&_folder) {
            Some(folder) => {
                match self.folders_v2.get(&folder.parent) {
                    Some(mut parent_folder) => {
                        let index = parent_folder.children.iter().position(|x| *x == _folder).unwrap();
                        parent_folder.children.remove(index);
                        self.folders_v2.remove(&_folder);
                        self.folders_v2.insert(&folder.parent, &parent_folder);
                    },
                    None => {}
                }
                self.folders.remove(&_folder);
            },
            None => {
                env::log(format!("Folder not found: '{}'", _folder).as_bytes());
            }
        };
    }

    pub fn get_shared_doc_of_user(&self, _account_id: String) -> Vec<String> {
        match self.shared_docs_of_user.get(&_account_id) {
            Some(shared_docs) => {
                shared_docs.to_vec()
            },
            None => {
                vec![]
            }
        }
    }

    pub fn get_shared_doc_detail(&self, _doc_id: String) -> (Option<SharedDoc>, Option<FolderV2>, Option<File>, String) {
        match self.shared_docs.get(&_doc_id) {
            Some(doc) => {
                let file = self.files.get(&doc.doc_id);
                let folder = self.folders_v2.get(&doc.doc_id);
                (Some(doc), folder, file, _doc_id)
            }
            None => {
                (None, None, None, _doc_id)
            }
        }
    } 

    pub fn get_root(&self, folder_id: String) -> (Option<FolderV2>, String) {
        let mut result = String::from("");
        match self.folders_v2.get(&folder_id) {
            Some(folder_by_id) => {
                let mut current_id = String::from(&folder_id[..]);
                let mut parent_id = String::from(&folder_by_id.parent[..]);
                while current_id.ne(&parent_id[..]) {
                    match self.folders_v2.get(&parent_id) {
                        Some(folder) => {
                            let temp = current_id.clone();
                            current_id = String::from(&parent_id[..]);
                            parent_id = folder.parent;
                            if current_id.eq(&parent_id) {
                                result = String::from(&temp[..]);
                            }
                        },
                        None => {},
                    };
                };
            }, 
            None => {
            }
        }
        match self.folders_v2.get(&result) {
            Some(root) => {
                (Some(root), result)
            }, 
            None => {
                (None, result)
            }
        }
    }

    pub fn get_file_info(&self, file_id: String) -> Option<File> {
        match self.files.get(&file_id) {
            Some(file) => Some(file),
            None => None,
        }
    }

    pub fn get_folder_info_v2(&self, folder_id: String) -> Option<FolderV2> {
        match self.folders_v2.get(&folder_id) {
            Some(folder) => Some(folder),
            None => None,
        }
    }

}


// #[cfg(test)]
// mod tests {
//     use super::*;
//     use near_sdk::MockedBlockchain;
//     use near_sdk::{testing_env, VMContext};

//     // mock the context for testing, notice "signer_account_id" that was accessed above from env::
//     fn get_context(input: Vec<u8>, is_view: bool) -> VMContext {
//         VMContext {
//             current_account_id: "alice_near".to_string(),
//             signer_account_id: "bob_near".to_string(),
//             signer_account_pk: vec![0, 1, 2],
//             predecessor_account_id: "carol_near".to_string(),
//             input,
//             block_index: 0,
//             block_timestamp: 0,
//             account_balance: 0,
//             account_locked_balance: 0,
//             storage_usage: 0,
//             attached_deposit: 0,
//             prepaid_gas: 10u64.pow(18),
//             random_seed: vec![0, 1, 2],
//             is_view,
//             output_data_receivers: vec![],
//             epoch_height: 19,
//         }
//     }

//     #[test]
//     fn set_then_get_greeting() {
//         let context = get_context(vec![], false);
//         testing_env!(context);
//         let mut contract = Contract::default();
//         // contract.set_greeting("howdy".to_string());
//         // assert_eq!(
//         //     "howdy".to_string(),
//         //     contract.get_greeting("bob_near".to_string())
//         // );
//     }

//     #[test]
//     fn get_default_greeting() {
//         let context = get_context(vec![], true);
//         testing_env!(context);
//         let contract = Contract::default();
//         // this test did not call set_greeting so should return the default "Hello" greeting
//         // assert_eq!(
//         //     "Hello".to_string(),
//         //     contract.get_greeting("francis.near".to_string())
//         // );
//     }
// }