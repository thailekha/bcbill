Vagrant.configure("2") do |config|
  config.vm.box = "peru/ubuntu-20.04-desktop-amd64"
  config.vm.box_version = "20220402.01"
  config.vm.provider :libvirt do |libvirt|
    libvirt.cpus = 6
    libvirt.memory = 10000
  end

  config.vm.provision "shell", privileged: false, inline: <<-SHELL
    echo testing > /tmp/testing.txt
  SHELL
end
