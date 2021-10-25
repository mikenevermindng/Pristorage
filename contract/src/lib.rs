use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen, setup_alloc};
use near_sdk::collections::{UnorderedMap, UnorderedSet};
use near_sdk::serde::{Serialize, Deserialize};
use std::option::Option::{Some, None};
use std::collections::HashMap;

setup_alloc!();

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct File {
    cid: String,
    name: String,
    encrypted_password: Option<String>,
    file_type: String
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Folder {
    name: String,
    files: Vec<String>,
    parent: String,
    children: Vec<String>,
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct SharedFolder {
    name: String,
    files: Vec<String>,
    parent: String,
    children: Vec<String>,
    folder_password: Option<String>,
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
    share_password: String
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct SharedFolderDoc {
    folder: String,
    share_password: String
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct SharedFileDocDetail {
    file: File,
    share_password: String,

}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct SharedFolderDocDetail {
    folder: SharedFolder,
    share_password: String
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Contract {
    folders: UnorderedMap<String, Folder>,
    shared_folders: UnorderedMap<String, SharedFolder>,
    users: UnorderedMap<String, User>,
    files: UnorderedMap<String, File>,

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
            users: UnorderedMap::new(b"u".to_vec()),
            files: UnorderedMap::new(b"fl".to_vec()),

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

    pub fn sign_up(&mut self, public_key: String, encrypted_token: String) {
        env::log(format!("public_key : '{}', encrypted_token: {}", public_key, encrypted_token).as_bytes());
        let account_id = env::signer_account_id();
        let user = User {
            public_key: public_key,
            encrypted_token: encrypted_token
        };
        self.users.insert(&account_id, &user);
        let root = Folder {
            name: String::from("root"),
            files: Vec::new(),
            parent: String::from(&account_id[..]),
            children: Vec::new(),
        };
        let root_shared_folder = SharedFolder {
            name: String::from("root"),
            files: Vec::new(),
            parent: String::from(&account_id[..]),
            children: Vec::new(),
            folder_password: None
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
        let _account_id = env::signer_account_id();
        match self.get_owner_by_folder_id(String::from(&_parent[..])) {
            Some(owner) => {
                assert_eq!(
                    String::from(&_account_id[..]), 
                    String::from(&owner[..]), 
                    "Owner not match: '{}', '{}'", _account_id, String::from(&owner[..])
                );
                match self.folders.get(&_parent) {
                    Some(mut folder) => {
                        folder.children.push(String::from(&_id[..]));
                        self.folders.insert(&_parent, &folder);
                        let new_folder = Folder {
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
            }, 
            None => {
                env::log(format!("Owner not found: '{}'", _parent).as_bytes());
            }
        }
        
    }

    pub fn create_shared_folder(&mut self, _id: String, _name: String, _parent: String, _password: String) {
        let _account_id = env::signer_account_id();
        match self.get_owner_by_shared_folder_id(String::from(&_parent[..])) {
            Some(owner) => {
                assert_eq!(
                    String::from(&_account_id[..]), 
                    String::from(&owner[..]), 
                    "Owner not match: '{}', '{}'", _account_id, String::from(&owner[..])
                );
                let mut folder_password = None;
                if _parent.eq(&_account_id) {
                    folder_password = Some(_password);
                }
                let _parent_id: &str = _parent.as_str();
                match self.shared_folders.get(&_parent) {
                    Some(mut folder) => {
                        folder.children.push(String::from(&_id[..]));
                        self.shared_folders.insert(&_parent, &folder);
                        let new_folder = SharedFolder {
                            name: String::from(&_name[..]),
                            files: Vec::new(),
                            parent: String::from(&_parent[..]),
                            children: Vec::new(),
                            folder_password: folder_password,
                        };
                        self.shared_folders.insert(&_id, &new_folder);
                    },
                    None => {
                        env::log(format!("Folder not found: '{}'", _parent).as_bytes());
                    }
                };
            },
            None => {
                env::log(format!("Owner not found: '{}'", _parent).as_bytes());
            }
        }
        
    }

    pub fn create_file(&mut self, _folder: String, _file_id: String, _cid: String, _name: String, _encrypted_password: String, _file_type: String) {
        let _account_id = env::signer_account_id();
        match self.get_owner_by_folder_id(String::from(&_folder[..])) {
            Some(owner) => {
                assert_eq!(
                    String::from(&_account_id[..]), 
                    String::from(&owner[..]), 
                    "Owner not match: '{}', '{}'", _account_id, String::from(&owner[..])
                );
                match self.folders.get(&_folder) {
                    Some(mut folder) => {
                        let file = File {
                            cid: _cid,
                            name: _name,
                            encrypted_password: Some(_encrypted_password),
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
            },
            None => {
                env::log(format!("Owner not found: '{}'", _folder).as_bytes());
            }
        };
    }

    pub fn create_shared_folder_file(&mut self, _folder: String, _file_id: String, _cid: String, _name: String, _file_type: String) {
        let _account_id = env::signer_account_id();
        match self.get_owner_by_shared_folder_id(String::from(&_folder[..])) {
            Some(owner) => {
                assert_eq!(
                    String::from(&_account_id[..]), 
                    String::from(&owner[..]), 
                    "Owner not match: '{}', '{}'", _account_id, String::from(&owner[..])
                );
                match self.shared_folders.get(&_folder) {
                    Some(mut folder) => {
                        let file = File {
                            cid: _cid,
                            name: _name,
                            encrypted_password: None,
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
            },
            None => {
                env::log(format!("Owner not match: '{}'", _folder).as_bytes());
            }
        }
    }

    pub fn share_file(&mut self, _file_id: String, _doc_id: String, _share_with: String, _parent_folder: String, _password: String) {
        let _account_id = env::signer_account_id();
        assert_ne!(
            String::from(&_account_id[..]), 
            String::from(&_share_with[..]), 
            "cannot share to your self {} - {}", &_account_id, &_share_with
        );
        match self.get_owner_by_folder_id(String::from(&_parent_folder[..])) {
            Some(owner) => {
                assert_eq!(
                    String::from(&_account_id[..]), 
                    String::from(&owner[..]), 
                    "Owner not match: '{}', '{}'", _account_id, String::from(&owner[..])
                );
                match self.folders.get(&_parent_folder) {
                    Some(folder) => {
                        let index = folder.files.iter().position(|f| String::from(&f[..]).eq(&_file_id[..]));
                        assert_eq!(
                            index.is_none(), 
                            false, 
                            "file {} not in folder {}", _file_id, _parent_folder
                        );
                        match self.shared_file_to_user.get(&_doc_id) {
                            Some(mut users) => {
                                users.insert(&_share_with);
                                self.shared_file_to_user.insert(&_doc_id, &users);
                            },
                            None => {
                                let mut prefix = Vec::with_capacity(33);
                                prefix.push(b'r');
                                prefix.extend(env::sha256(_account_id.as_bytes()));
                                let mut new_users = UnorderedSet::new(prefix.to_vec());
                                new_users.insert(&_share_with);
                                self.shared_file_to_user.insert(&_doc_id, &new_users);
                            }
                        }
                        match self.user_to_shared_file.get(&_share_with) {
                            Some(mut owner_to_files) => {
                                match owner_to_files.get(&_account_id) {
                                    Some(mut files) => {
                                        files.insert(&_doc_id);
                                        owner_to_files.insert(&_account_id, &files);
                                        self.user_to_shared_file.insert(&_share_with, &owner_to_files);
                                    },
                                    None => {
                                        let mut prefix = Vec::with_capacity(33);
                                        prefix.push(b's');
                                        prefix.extend(env::sha256(_account_id.as_bytes()));
                                        let mut new_files: UnorderedSet<String> = UnorderedSet::new(prefix.to_vec());
                                        new_files.insert(&_doc_id);
                                        owner_to_files.insert(&_account_id, &new_files);
                                        self.user_to_shared_file.insert(&_share_with, &owner_to_files);
                                    }
                                }
                            },
                            None => {
                                let mut files_prefix = Vec::with_capacity(33);
                                files_prefix.push(b's');
                                files_prefix.extend(env::sha256(_account_id.as_bytes()));
                                let mut new_files = UnorderedSet::new(files_prefix.to_vec());
                                new_files.insert(&_doc_id);

                                let mut account_files_prefix = Vec::with_capacity(33);
                                account_files_prefix.push(b'm');
                                account_files_prefix.extend(env::sha256(_account_id.as_bytes()));
                                let mut new_owner_to_files = UnorderedMap::new(account_files_prefix.to_vec());
                                new_owner_to_files.insert(&_account_id, &new_files);
                                self.user_to_shared_file.insert(&_share_with, &new_owner_to_files);
                            }
                        }
                        let share_doc = SharedFileDoc {
                            file: _file_id,
                            share_password: _password
                        };
                        self.shared_file_docs.insert(&_doc_id, &share_doc);
                        
                    }, 
                    None => {
                        env::log(format!("Folder not found: '{}'", _parent_folder).as_bytes());
                    }
                }
            },
            None => {
                env::log(format!("Owner not match: '{}'", _parent_folder).as_bytes());
            }
        }
    }

    pub fn share_folder(&mut self, _folder_id: String, _doc_id: String, _share_with: String, _password: String) {
        let _account_id = env::signer_account_id();
        assert_ne!(
            String::from(&_account_id[..]), 
            String::from(&_share_with[..]), 
            "cannot share to your self"
        );
        match self.get_owner_by_shared_folder_id(String::from(&_folder_id[..])) {
            Some(owner) => {
                assert_eq!(
                    String::from(&_account_id[..]), 
                    String::from(&owner[..]), 
                    "Owner not match: '{}', '{}'", _account_id, String::from(&owner[..])
                );
                match self.shared_folders.get(&_folder_id) {
                    Some(folder) => {
                        match self.shared_folder_to_user.get(&_doc_id) {
                            Some(mut users) => {
                                users.insert(&_share_with);
                                self.shared_folder_to_user.insert(&_doc_id, &users);
                            },
                            None => {
                                let mut prefix = Vec::with_capacity(33);
                                prefix.push(b'n');
                                prefix.extend(env::sha256(_account_id.as_bytes()));
                                let mut new_users = UnorderedSet::new(prefix.to_vec());
                                new_users.insert(&_share_with);
                                self.shared_folder_to_user.insert(&_doc_id, &new_users);
                            }
                        }
                        match self.user_to_shared_folder.get(&_share_with) {
                            Some(mut user_to_folder) => {
                                match user_to_folder.get(&_account_id) {
                                    Some(mut folders) => {
                                        folders.insert(&_doc_id);
                                        user_to_folder.insert(&_account_id, &folders);
                                        self.user_to_shared_folder.insert(&_share_with, &user_to_folder);
                                    },
                                    None => {
                                        let mut prefix = Vec::with_capacity(33);
                                        prefix.push(b'a');
                                        prefix.extend(env::sha256(_account_id.as_bytes()));
                                        let mut new_folders: UnorderedSet<String> = UnorderedSet::new(prefix.to_vec());
                                        new_folders.insert(&_doc_id);
                                        user_to_folder.insert(&_account_id, &new_folders);
                                        self.user_to_shared_folder.insert(&_share_with, &user_to_folder);
                                    }
                                }
                            },
                            None => {
                                let mut files_prefix = Vec::with_capacity(33);
                                files_prefix.push(b'a');
                                files_prefix.extend(env::sha256(_account_id.as_bytes()));
                                let mut new_folders = UnorderedSet::new(files_prefix.to_vec());
                                new_folders.insert(&_doc_id);

                                let mut account_folders_prefix = Vec::with_capacity(33);
                                account_folders_prefix.push(b'n');
                                account_folders_prefix.extend(env::sha256(_account_id.as_bytes()));
                                let mut new_user_to_folders = UnorderedMap::new(account_folders_prefix.to_vec());
                                
                                new_user_to_folders.insert(&_account_id, &new_folders);
                                self.user_to_shared_folder.insert(&_share_with, &new_user_to_folders);
                            }
                        }
                        let share_doc = SharedFolderDoc {
                            folder: _folder_id,
                            share_password: _password
                        };
                        self.shared_folder_docs.insert(&_doc_id, &share_doc);
                    }, 
                    None => {
                        env::log(format!("Folder not found: '{}'", _folder_id).as_bytes());
                    }
                }
            },
            None => {
                env::log(format!("Owner not match: '{}'", _folder_id).as_bytes());
            }
        }
    }

    pub fn remove_file(&mut self, _folder: String, _file: String) {
        let _account_id = env::signer_account_id();
        match self.get_owner_by_folder_id(String::from(&_folder[..])) {
            Some(owner) => {
                assert_eq!(
                    String::from(&_account_id[..]), 
                    String::from(&owner[..]), 
                    "Owner not match: '{}', '{}'", _account_id, String::from(&owner[..])
                );
                match self.folders.get(&_folder) {
                    Some(mut folder) => {
                        let index = folder.files.iter().position(|x| *x == _file).unwrap();
                        folder.files.remove(index);
                        self.folders.insert(&_folder, &folder);
                        self.files.remove(&_file);
                    },
                    None => {
                        env::log(format!("Folder not found: '{}'", _folder).as_bytes());
                    }
                };
            },
            None => {
                env::log(format!("Owner not found: '{}'", _folder).as_bytes());
            }
        }
    }

    pub fn remove_shared_file(&mut self, _folder: String, _file: String) {
        let _account_id = env::signer_account_id();
        match self.get_owner_by_shared_folder_id(String::from(&_folder[..])) {
            Some(owner) => {
                assert_eq!(
                    String::from(&_account_id[..]), 
                    String::from(&owner[..]), 
                    "Owner not match: '{}', '{}'", _account_id, String::from(&owner[..])
                );
                match self.shared_folders.get(&_folder) {
                    Some(mut folder) => {
                        let index = folder.files.iter().position(|x| *x == _file).unwrap();
                        folder.files.remove(index);
                        self.shared_folders.insert(&_folder, &folder);
                        self.files.remove(&_file);
                    },
                    None => {
                        env::log(format!("Folder not found: '{}'", _folder).as_bytes());
                    }
                };
            },
            None => {
                env::log(format!("Owner not found: '{}'", _folder).as_bytes());
            }
        }
    }

    pub fn remove_folder(&mut self, _folder: String) {
        let _account_id = env::signer_account_id();
        match self.get_owner_by_folder_id(String::from(&_folder[..])) {
            Some(owner) => {
                assert_eq!(
                    String::from(&_account_id[..]), 
                    String::from(&owner[..]), 
                    "Owner not match: '{}', '{}'", _account_id, String::from(&owner[..])
                );
                match self.folders.get(&_folder) {
                    Some(folder) => {
                        match self.folders.get(&folder.parent) {
                            Some(mut parent_folder) => {
                                let index = parent_folder.children.iter().position(|x| *x == _folder).unwrap();
                                parent_folder.children.remove(index);
                                self.folders.remove(&_folder);
                                self.folders.insert(&folder.parent, &parent_folder);
                            },
                            None => {}
                        }
                        self.folders.remove(&_folder);
                    },
                    None => {
                        env::log(format!("Folder not found: '{}'", _folder).as_bytes());
                    }
                };
            },
            None => {
                env::log(format!("Folder not found: '{}'", _folder).as_bytes());
            }
        }
    }

    pub fn remove_shared_folder(&mut self, _folder: String) {
        let _account_id = env::signer_account_id();
        match self.get_owner_by_shared_folder_id(String::from(&_folder[..])) {
            Some(owner) => {
                assert_eq!(
                    String::from(&_account_id[..]), 
                    String::from(&owner[..]), 
                    "Owner not match: '{}', '{}'", _account_id, String::from(&owner[..])
                );
                match self.shared_folders.get(&_folder) {
                    Some(folder) => {
                        match self.shared_folders.get(&folder.parent) {
                            Some(mut parent_folder) => {
                                let index = parent_folder.children.iter().position(|x| *x == _folder).unwrap();
                                parent_folder.children.remove(index);
                                self.folders.remove(&_folder);
                                self.shared_folders.insert(&folder.parent, &parent_folder);
                            },
                            None => {}
                        }
                        self.shared_folders.remove(&_folder);
                    },
                    None => {

                    }
                };
            },
            None => {
                env::log(format!("You are not owner").as_bytes());
            }
        };
    }

    pub fn get_shared_folders_of_user(&self, _account_id: String) -> Option<HashMap<String, Vec<String>>> {
        match self.user_to_shared_folder.get(&_account_id) {
            Some(shared_folder_map) => {
                let keys = shared_folder_map.keys_as_vector();
                let mut result: HashMap<String, Vec<String>> = HashMap::new();
                for key in keys.iter() {
                    match shared_folder_map.get(&key) {
                        Some(value) => {
                            result.insert(key, value.to_vec());
                        },
                        None => {}
                    }
                };
                Some(result)
            },
            None => None
        }
    }

    pub fn get_shared_user_of_folder(&self, _file: String) -> Option<Vec<String>> {
        match self.shared_folder_to_user.get(&_file) {
            Some(list) => Some(list.to_vec()),
            None => None
        }
    }

    pub fn get_shared_files_of_user(&self, _account_id: String) -> Option<HashMap<String, Vec<String>>> {
        match self.user_to_shared_file.get(&_account_id) {
            Some(user_shared_file) => {
                let keys = user_shared_file.keys_as_vector();
                let mut result: HashMap<String, Vec<String>> = HashMap::new();
                for key in keys.iter() {
                    match user_shared_file.get(&key) {
                        Some(value) => {
                            result.insert(key, value.to_vec());
                        },
                        None => {}
                    }
                };
                Some(result)
            },
            None => None
        }
    }

    pub fn get_shared_file_doc(&self, _doc: String) -> Option<SharedFileDoc> {
        match self.shared_file_docs.get(&_doc) {
            Some(doc) => Some(doc),
            None => None
        }
    }

    pub fn get_shared_folder_doc(&self, _doc: String) -> Option<SharedFolderDoc> {
        match self.shared_folder_docs.get(&_doc) {
            Some(doc) => Some(doc),
            None => None
        }
    }

    pub fn get_shared_folder_docs_by_owner(&self, _account_id: String) -> Vec<(String, String, String, SharedFolder)> {
        let mut result: Vec<(String, String, String, SharedFolder)> = Vec::new();
        match self.user_to_shared_folder.get(&_account_id) {
            Some(account_to_docs) => {
                let accounts = account_to_docs.keys_as_vector();
                for account in accounts.iter() {
                    match account_to_docs.get(&account) {
                        Some(set_docs) => {
                            let doc_id_keys = set_docs.to_vec();
                            for doc_id in doc_id_keys.iter() {
                                match self.shared_folder_docs.get(&doc_id) {
                                    Some(doc) => {
                                        match self.shared_folders.get(&doc.folder) {
                                            Some(folder) => {
                                                result.push((String::from(&account[..]), doc.folder, doc.share_password, folder));
                                            },
                                            None => {}
                                        }
                                    }, 
                                    None => {}
                                }
                            }
                        },
                        None => {}
                    }
                };
            },
            None => {}
        }
        result
    }

    pub fn get_shared_file_docs_by_owner(&self, _account_id: String) ->Vec<(String, String, String, File)> {
        let mut result: Vec<(String, String, String, File)> = Vec::new();
        match self.user_to_shared_file.get(&_account_id) {
            Some(account_to_docs) => {
                let accounts = account_to_docs.keys_as_vector();
                for account in accounts.iter() {
                    match account_to_docs.get(&account) {
                        Some(set_docs) => {
                            let doc_id_keys = set_docs.to_vec();
                            for doc_id in doc_id_keys.iter() {
                                match self.shared_file_docs.get(&doc_id) {
                                    Some(doc) => {
                                        match self.files.get(&doc.file) {
                                            Some(file) => {
                                                result.push((String::from(&account[..]), doc.file, doc.share_password, file));
                                            },
                                            None => {}
                                        }
                                    }, 
                                    None => {}
                                }
                            }
                        },
                        None => {}
                    }
                };
            },
            None => {}
        }
        result
    }

    pub fn get_shared_user_of_file(&self, _file: String) -> Option<Vec<String>> {
        match self.shared_file_to_user.get(&_file) {
            Some(list) => Some(list.to_vec()),
            None => None
        }
    }

    pub fn get_file_info(&self, file_id: String) -> Option<File> {
        match self.files.get(&file_id) {
            Some(file) => Some(file),
            None => None,
        }
    }

    pub fn get_root_shared_folder(&self, _current: String, _account_id: String) -> Option<(String, SharedFolder)> {
        let mut current_id = String::from(&_current[..]);
        let mut root_id = String::from("");
        while current_id.ne(&_account_id) {
            match self.shared_folders.get(&current_id) {
                Some(folder) => {
                    root_id = String::from(&current_id[..]);
                    current_id = folder.parent;
                },
                None => {},
            };
        };
        match self.shared_folders.get(&root_id) {
            Some(folder) => Some((root_id, folder)),
            None => None,
        }
    }

    pub fn get_owner_by_folder_id(&self, _folder_id: String) -> Option<String> {
        let mut current_id = String::from(&_folder_id[..]);
        while self.users.get(&current_id).is_none() {
            match self.folders.get(&current_id) {
                Some(folder) => {
                    current_id = folder.parent;
                },
                None => {},
            };
        };
        Some(current_id)
    }

    pub fn get_owner_by_shared_folder_id(&self, _shared_folder_id: String) -> Option<String> {
        match self.shared_folders.get(&_shared_folder_id) {
            Some(folder_by_id) => {
                let mut current_id = String::from(&_shared_folder_id[..]);
                let mut parent_id = String::from(&folder_by_id.parent[..]);
                while current_id.ne(&parent_id[..]) {
                    match self.shared_folders.get(&parent_id) {
                        Some(folder) => {
                            parent_id = folder.parent;
                            current_id = String::from(&parent_id[..]);
                        },
                        None => {},
                    };
                };
                Some(current_id)
            }, 
            None => {
                None
            }
        }
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
