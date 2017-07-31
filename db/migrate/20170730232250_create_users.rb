class CreateUsers < ActiveRecord::Migration[5.0]
  def change
    create_table :users do |t|
      t.string :username, limit: 10, null: false
      t.string :password_digest, null: false
      t.string :email, null: false
      t.string :occupation, limit: 50
      t.string :rol, limit: 20, null: false, default: "user"
      t.timestamps
    end

    add_index :users, :email, unique: true
  end
end
