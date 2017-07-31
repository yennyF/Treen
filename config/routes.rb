Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  post 'login', to: 'sessions#create', as: 'login'
  get 'logout', to: 'sessions#destroy', as: 'logout'
  
  get 'home', to: 'home#index', as: 'home'
  post 'home/recoverUser'
  post 'home/createUser'

  #resources :documents
  get 'documents', to: 'documents#index', as: 'documents'
  get 'documents/show'
  post 'documents/document'
  post 'documents/getDocumentsOrderByName'
  post 'documents/open'
  post 'documents/create'
  post 'documents/edit'
  post 'documents/updateName'
  post 'documents/updateContent'
  post 'documents/delete'

  get 'users', to: 'users#index', as: 'users'
  get 'users/setting'
  post 'users/user'
  post 'users/getUsersOrderByUsername'
  post 'users/getUsersOrderByEmail'
  post 'users/getUsersOrderByOccupation'
  post 'users/getUsersOrderByRol'
  post 'users/create'
  post 'users/edit'
  post 'users/update'
  post 'users/updatePersonal'
  post 'users/updatePassword'
  post 'users/delete'

  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"
  root 'home#index'
end
